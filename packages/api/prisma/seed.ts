// ============================================================
// Database Seed Script
// ============================================================
// This script runs ONCE to insert the default categories into
// the database. Think of "seeding" like planting initial data
// that the app needs to function.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
    { name: 'Fruits & Vegetables', icon: '🥦', sortOrder: 1 },
    { name: 'Dairy & Eggs', icon: '🥛', sortOrder: 2 },
    { name: 'Grains & Staples', icon: '🌾', sortOrder: 3 },
    { name: 'Spices & Condiments', icon: '🧂', sortOrder: 4 },
    { name: 'Snacks & Beverages', icon: '☕', sortOrder: 5 },
    { name: 'Meat & Seafood', icon: '🍗', sortOrder: 6 },
    { name: 'Household & Cleaning', icon: '🧹', sortOrder: 7 },
    { name: 'Personal Care', icon: '🧴', sortOrder: 8 },
    { name: 'Baby & Kids', icon: '🍼', sortOrder: 9 },
    { name: 'Other', icon: '📦', sortOrder: 10 },
];

async function main() {
    console.log('🌱 Seeding database...');

    // Check if default categories already exist
    const existingCount = await prisma.category.count({
        where: { ownerType: 'SYSTEM' }
    });

    if (existingCount > 0) {
        console.log('✅ Default categories already exist. Skipping seed.');
        return;
    }

    // Insert each default category
    for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.create({
            data: {
                name: cat.name,
                icon: cat.icon,
                sortOrder: cat.sortOrder,
                isDefault: true,
                ownerType: 'SYSTEM',
                ownerId: null,
            },
        });
        console.log(`  ✅ Created category: ${cat.icon} ${cat.name}`);
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
