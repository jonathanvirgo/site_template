#!/usr/bin/env node
/**
 * Cập nhật homepage để dùng ecommerce theme
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Updating homepage to use ecommerce theme...\n');

    // Get ecommerce theme id
    const ecommerceTheme = await prisma.theme.findFirst({
        where: { slug: 'ecommerce' }
    });

    if (!ecommerceTheme) {
        console.error('❌ Ecommerce theme not found');
        return;
    }

    console.log(`Found ecommerce theme: id=${ecommerceTheme.id}`);

    // Update homepage to use ecommerce theme and reset content for fresh rendering
    const updated = await prisma.page.updateMany({
        where: { isHomepage: true },
        data: {
            themeId: ecommerceTheme.id,
            template: 'home',
            content: null // Clear content so it uses default template layout
        }
    });

    console.log(`✅ Updated ${updated.count} homepage(s) to use ecommerce theme`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
