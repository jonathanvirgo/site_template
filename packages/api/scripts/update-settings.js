#!/usr/bin/env node
/**
 * Update settings for ecommerce theme
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Updating site settings for ecommerce theme...\n');

    const updates = [
        { key: 'site_name', value: 'Modern Shop' },
        { key: 'site_tagline', value: 'Premium Products for Modern Living' },
        { key: 'site_description', value: 'Discover premium skincare and wellness products. Shop our curated collection of high-quality health and beauty essentials.' },
        { key: 'footer_copyright', value: '© 2024 Modern Shop. All rights reserved.' },
    ];

    for (const { key, value } of updates) {
        await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        console.log(`   ✅ ${key} = "${value}"`);
    }

    console.log('\n🎉 Settings updated successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
