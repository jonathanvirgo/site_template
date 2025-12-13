#!/usr/bin/env node
/**
 * Script to fix demo data: 
 * 1. Activate ecommerce theme
 * 2. Add Unsplash images to products and posts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Unsplash images for products (skincare/healthcare theme)
const productImages = [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop', // Skincare products
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop', // Serum
    'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=600&h=600&fit=crop', // Cream jar
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop', // Skincare set
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=600&fit=crop', // Bottles
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop', // Dropper
    'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=600&fit=crop', // Face cream
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop', // Vitamin C
    'https://images.unsplash.com/photo-1617897903246-719242758050?w=600&h=600&fit=crop', // Natural products
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop', // Wellness
    'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=600&h=600&fit=crop', // Cosmetics
    'https://images.unsplash.com/photo-1552046122-03184de85e08?w=600&h=600&fit=crop', // Health products
];

// Unsplash images for posts (health/wellness/news theme)
const postImages = [
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=450&fit=crop', // Healthy food
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop', // Yoga/wellness
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop', // Health fitness
    'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=450&fit=crop', // Skincare routine
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&h=450&fit=crop', // Spa treatment
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50c?w=800&h=450&fit=crop', // Healthy lifestyle
    'https://images.unsplash.com/photo-1571781565036-d3b6adae9ea4?w=800&h=450&fit=crop', // Beauty routine
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=450&fit=crop', // Meditation
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=450&fit=crop', // Relaxation
    'https://images.unsplash.com/photo-1611073615830-3e6c8f70f480?w=800&h=450&fit=crop', // Supplements
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=450&fit=crop', // Healthy eating
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=450&fit=crop', // Fitness
];

async function main() {
    console.log('🔧 Fixing demo data...\n');

    // 1. Activate ecommerce theme
    console.log('1️⃣ Activating ecommerce theme...');

    // First, deactivate all themes
    await prisma.theme.updateMany({
        where: {},
        data: { isActive: false }
    });

    // Then activate ecommerce
    const updated = await prisma.theme.updateMany({
        where: { slug: 'ecommerce' },
        data: { isActive: true }
    });

    console.log(`   ✅ Activated ecommerce theme (${updated.count} updated)\n`);

    // 2. Update products with images
    console.log('2️⃣ Adding images to products...');
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'asc' }
    });

    for (let i = 0; i < products.length; i++) {
        const imageUrl = productImages[i % productImages.length];
        await prisma.product.update({
            where: { id: products[i].id },
            data: {
                images: JSON.stringify([imageUrl]),
            }
        });
    }
    console.log(`   ✅ Updated ${products.length} products with images\n`);

    // 3. Update posts with images
    console.log('3️⃣ Adding images to posts...');
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'asc' }
    });

    for (let i = 0; i < posts.length; i++) {
        const imageUrl = postImages[i % postImages.length];
        await prisma.post.update({
            where: { id: posts[i].id },
            data: { featuredImage: imageUrl }
        });
    }
    console.log(`   ✅ Updated ${posts.length} posts with images\n`);

    console.log('🎉 Demo data fixed successfully!');
    console.log('\n📖 Summary:');
    console.log('   - Theme: ecommerce (activated)');
    console.log(`   - Products: ${products.length} with Unsplash images`);
    console.log(`   - Posts: ${posts.length} with Unsplash images`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
