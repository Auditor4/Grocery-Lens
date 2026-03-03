// ============================================================
// Group Routes — Create, manage, add/remove members
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { generateGroupCode } from '../services/uid.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ─── GET /api/groups ─────────────────────────────────────
// List all groups the user belongs to
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const memberships = await prisma.groupMember.findMany({
            where: { userId: req.user!.id },
            include: {
                group: {
                    include: {
                        members: {
                            include: {
                                user: { select: { userId: true, displayName: true } },
                            },
                        },
                    },
                },
            },
        });

        const groups = memberships.map((m) => ({
            ...m.group,
            myRole: m.role,
        }));

        res.json({ success: true, data: groups });
    } catch (error) {
        console.error('List groups error:', error);
        res.status(500).json({ success: false, error: 'Failed to load groups.' });
    }
});

// ─── POST /api/groups ────────────────────────────────────
// Create a new group
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ success: false, error: 'Group name is required.' });
            return;
        }

        const groupCode = generateGroupCode();

        const group = await prisma.group.create({
            data: {
                groupCode,
                name: name.trim(),
                createdBy: req.user!.id,
                members: {
                    create: {
                        userId: req.user!.id,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { userId: true, displayName: true } },
                    },
                },
            },
        });

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ success: false, error: 'Failed to create group.' });
    }
});

// ─── POST /api/groups/:id/members ────────────────────────
// Add a member to the group (admin only, by UID code)
router.post('/:id/members', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const groupId = req.params.id;
        const { uid } = req.body;

        if (!uid || typeof uid !== 'string') {
            res.status(400).json({ success: false, error: 'UID is required to add a member.' });
            return;
        }

        // Check admin permission
        const adminMembership = await prisma.groupMember.findFirst({
            where: { groupId, userId: req.user!.id, role: 'ADMIN' },
        });

        if (!adminMembership) {
            res.status(403).json({ success: false, error: 'Only group admins can add members.' });
            return;
        }

        // Find user by searching through all users (we need to bcrypt compare)
        // Since we can't search by UID directly (it's hashed), we check all users
        // In production, you'd want a lookup table or different approach
        const { default: bcrypt } = await import('bcryptjs');
        const allUsers = await prisma.user.findMany();
        let targetUser = null;

        for (const user of allUsers) {
            const isMatch = await bcrypt.compare(uid.trim(), user.uidHash);
            if (isMatch) {
                targetUser = user;
                break;
            }
        }

        if (!targetUser) {
            res.status(404).json({ success: false, error: 'No user found with that UID.' });
            return;
        }

        // Check if already a member
        const existingMember = await prisma.groupMember.findFirst({
            where: { groupId, userId: targetUser.id },
        });

        if (existingMember) {
            res.status(409).json({ success: false, error: 'User is already a member of this group.' });
            return;
        }

        // Add the member
        await prisma.groupMember.create({
            data: {
                groupId,
                userId: targetUser.id,
                role: 'MEMBER',
            },
        });

        res.status(201).json({
            success: true,
            data: {
                message: `${targetUser.displayName} has been added to the group.`,
                userId: targetUser.userId,
                displayName: targetUser.displayName,
            },
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, error: 'Failed to add member.' });
    }
});

// ─── DELETE /api/groups/:id/members/:memberId ────────────
// Remove a member from the group
router.delete('/:id/members/:memberId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: groupId, memberId } = req.params;

        // Check admin permission (or self-removal)
        const adminMembership = await prisma.groupMember.findFirst({
            where: { groupId, userId: req.user!.id, role: 'ADMIN' },
        });

        const isSelfRemoval = memberId === req.user!.id;

        if (!adminMembership && !isSelfRemoval) {
            res.status(403).json({ success: false, error: 'Only admins can remove members.' });
            return;
        }

        await prisma.groupMember.deleteMany({
            where: { groupId, userId: memberId },
        });

        res.json({ success: true, data: { message: 'Member removed.' } });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, error: 'Failed to remove member.' });
    }
});

// ─── DELETE /api/groups/:id ──────────────────────────────
// Delete a group (admin only)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const groupId = req.params.id;

        const adminMembership = await prisma.groupMember.findFirst({
            where: { groupId, userId: req.user!.id, role: 'ADMIN' },
        });

        if (!adminMembership) {
            res.status(403).json({ success: false, error: 'Only admins can delete a group.' });
            return;
        }

        // Delete group entries first (or keep them orphaned)
        await prisma.groceryEntry.deleteMany({ where: { groupId } });
        await prisma.group.delete({ where: { id: groupId } });

        res.json({ success: true, data: { message: 'Group deleted.' } });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete group.' });
    }
});

export default router;
