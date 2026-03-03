// ============================================================
// Analytics Routes — Dashboard data
// ============================================================

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// Helper: Build date range filter
function getDateRange(startDate?: string, endDate?: string) {
    const start = startDate
        ? new Date(startDate)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // 1st of current month
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// Helper: Build scope filter
function getScopeFilter(req: AuthRequest, scopeType?: string, groupId?: string) {
    if (scopeType === 'GROUP' && groupId) {
        return { groupId, scopeType: 'GROUP' };
    }
    return { addedBy: req.user!.id, scopeType: 'PERSONAL' };
}

// ─── GET /api/analytics/summary ──────────────────────────
// Monthly overview: total spend, item count, avg, MoM change
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType, groupId } = req.query as Record<string, string>;
        const { start, end } = getDateRange(startDate, endDate);
        const scopeFilter = getScopeFilter(req, scopeType, groupId);

        // Current period
        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: start, lte: end },
            },
        });

        const totalSpend = entries.reduce((sum, e) => sum + e.amount, 0);
        const itemCount = entries.length;
        const uniqueItems = new Set(entries.map((e) => e.name.toLowerCase())).size;
        const avgPerEntry = itemCount > 0 ? totalSpend / itemCount : 0;

        // Previous month for comparison
        const prevStart = new Date(start);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);
        prevEnd.setHours(23, 59, 59, 999);

        const prevEntries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: prevStart, lte: prevEnd },
            },
        });

        const lastMonthSpend = prevEntries.reduce((sum, e) => sum + e.amount, 0);
        const percentChange = lastMonthSpend > 0
            ? ((totalSpend - lastMonthSpend) / lastMonthSpend) * 100
            : 0;

        res.json({
            success: true,
            data: {
                totalSpend: Math.round(totalSpend * 100) / 100,
                itemCount,
                uniqueItems,
                avgPerEntry: Math.round(avgPerEntry * 100) / 100,
                lastMonthSpend: Math.round(lastMonthSpend * 100) / 100,
                percentChange: Math.round(percentChange * 10) / 10,
            },
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ success: false, error: 'Failed to load summary.' });
    }
});

// ─── GET /api/analytics/by-category ──────────────────────
router.get('/by-category', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType, groupId } = req.query as Record<string, string>;
        const { start, end } = getDateRange(startDate, endDate);
        const scopeFilter = getScopeFilter(req, scopeType, groupId);

        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: start, lte: end },
            },
            include: { category: true },
        });

        // Group by category
        const categoryMap = new Map<string, { name: string; icon?: string | null; spend: number; count: number }>();
        const totalSpend = entries.reduce((sum, e) => sum + e.amount, 0);

        for (const entry of entries) {
            const key = entry.categoryId;
            const existing = categoryMap.get(key) || {
                name: entry.category.name,
                icon: entry.category.icon,
                spend: 0,
                count: 0,
            };
            existing.spend += entry.amount;
            existing.count++;
            categoryMap.set(key, existing);
        }

        const data = Array.from(categoryMap.entries())
            .map(([categoryId, info]) => ({
                categoryId,
                categoryName: info.name,
                categoryIcon: info.icon,
                totalSpend: Math.round(info.spend * 100) / 100,
                percentage: totalSpend > 0 ? Math.round((info.spend / totalSpend) * 1000) / 10 : 0,
                itemCount: info.count,
            }))
            .sort((a, b) => b.totalSpend - a.totalSpend);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics by-category error:', error);
        res.status(500).json({ success: false, error: 'Failed to load category analytics.' });
    }
});

// ─── GET /api/analytics/by-channel ───────────────────────
router.get('/by-channel', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType, groupId } = req.query as Record<string, string>;
        const { start, end } = getDateRange(startDate, endDate);
        const scopeFilter = getScopeFilter(req, scopeType, groupId);

        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: start, lte: end },
            },
        });

        const channelMap = new Map<string, { spend: number; count: number }>();
        const totalSpend = entries.reduce((sum, e) => sum + e.amount, 0);

        for (const entry of entries) {
            const existing = channelMap.get(entry.channel) || { spend: 0, count: 0 };
            existing.spend += entry.amount;
            existing.count++;
            channelMap.set(entry.channel, existing);
        }

        const data = Array.from(channelMap.entries())
            .map(([channel, info]) => ({
                channel,
                totalSpend: Math.round(info.spend * 100) / 100,
                percentage: totalSpend > 0 ? Math.round((info.spend / totalSpend) * 1000) / 10 : 0,
                entryCount: info.count,
            }))
            .sort((a, b) => b.totalSpend - a.totalSpend);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics by-channel error:', error);
        res.status(500).json({ success: false, error: 'Failed to load channel analytics.' });
    }
});

// ─── GET /api/analytics/by-item ──────────────────────────
router.get('/by-item', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType, groupId } = req.query as Record<string, string>;
        const { start, end } = getDateRange(startDate, endDate);
        const scopeFilter = getScopeFilter(req, scopeType, groupId);

        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: start, lte: end },
            },
            orderBy: { purchaseDate: 'asc' },
        });

        const itemMap = new Map<string, {
            spend: number; qty: number; unit: string;
            count: number; dates: Date[];
        }>();

        for (const entry of entries) {
            const key = entry.name.toLowerCase();
            const existing = itemMap.get(key) || {
                spend: 0, qty: 0, unit: entry.unit,
                count: 0, dates: [],
            };
            existing.spend += entry.amount;
            existing.qty += entry.quantity;
            existing.count++;
            existing.dates.push(entry.purchaseDate);
            itemMap.set(key, existing);
        }

        const data = Array.from(itemMap.entries())
            .map(([name, info]) => {
                // Calculate avg days between purchases
                let avgDaysBetween: number | undefined;
                if (info.dates.length >= 2) {
                    const sorted = info.dates.sort((a, b) => a.getTime() - b.getTime());
                    let totalDays = 0;
                    for (let i = 1; i < sorted.length; i++) {
                        totalDays += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
                    }
                    avgDaysBetween = Math.round(totalDays / (sorted.length - 1));
                }

                return {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    totalSpend: Math.round(info.spend * 100) / 100,
                    totalQuantity: Math.round(info.qty * 1000) / 1000,
                    unit: info.unit,
                    avgUnitPrice: info.qty > 0 ? Math.round((info.spend / info.qty) * 100) / 100 : 0,
                    purchaseCount: info.count,
                    avgDaysBetween,
                };
            })
            .sort((a, b) => b.totalSpend - a.totalSpend);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics by-item error:', error);
        res.status(500).json({ success: false, error: 'Failed to load item analytics.' });
    }
});

// ─── GET /api/analytics/trends ───────────────────────────
// Weekly spend trend for charts
router.get('/trends', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, scopeType, groupId, granularity = 'daily' } = req.query as Record<string, string>;
        const { start, end } = getDateRange(startDate, endDate);
        const scopeFilter = getScopeFilter(req, scopeType, groupId);

        const entries = await prisma.groceryEntry.findMany({
            where: {
                ...scopeFilter,
                purchaseDate: { gte: start, lte: end },
            },
            orderBy: { purchaseDate: 'asc' },
        });

        // Group by date
        const dateMap = new Map<string, number>();

        for (const entry of entries) {
            let key: string;
            const d = entry.purchaseDate;

            if (granularity === 'monthly') {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (granularity === 'weekly') {
                // Get the Monday of the week
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d);
                monday.setDate(diff);
                key = monday.toISOString().split('T')[0];
            } else {
                key = d.toISOString().split('T')[0];
            }

            dateMap.set(key, (dateMap.get(key) || 0) + entry.amount);
        }

        const data = Array.from(dateMap.entries())
            .map(([date, amount]) => ({
                date,
                amount: Math.round(amount * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics trends error:', error);
        res.status(500).json({ success: false, error: 'Failed to load trends.' });
    }
});

// ─── GET /api/analytics/by-member ────────────────────────
// Group-only: spend breakdown by member
router.get('/by-member', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, groupId } = req.query as Record<string, string>;

        if (!groupId) {
            res.status(400).json({ success: false, error: 'Group ID is required.' });
            return;
        }

        const { start, end } = getDateRange(startDate, endDate);

        const entries = await prisma.groceryEntry.findMany({
            where: {
                groupId,
                scopeType: 'GROUP',
                purchaseDate: { gte: start, lte: end },
            },
            include: {
                user: { select: { userId: true, displayName: true } },
            },
        });

        const memberMap = new Map<string, { userId: string; displayName: string; spend: number; count: number }>();

        for (const entry of entries) {
            const key = entry.addedBy;
            const existing = memberMap.get(key) || {
                userId: entry.user.userId,
                displayName: entry.user.displayName,
                spend: 0,
                count: 0,
            };
            existing.spend += entry.amount;
            existing.count++;
            memberMap.set(key, existing);
        }

        const totalSpend = entries.reduce((sum, e) => sum + e.amount, 0);

        const data = Array.from(memberMap.values())
            .map((m) => ({
                ...m,
                spend: Math.round(m.spend * 100) / 100,
                percentage: totalSpend > 0 ? Math.round((m.spend / totalSpend) * 1000) / 10 : 0,
            }))
            .sort((a, b) => b.spend - a.spend);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics by-member error:', error);
        res.status(500).json({ success: false, error: 'Failed to load member analytics.' });
    }
});

export default router;
