/**
 * Import demo data directly to database
 * Run from packages/api: node scripts/import-demo-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../../../themes/ecommerce/demo/data.json');

async function importDemoData() {
    console.log('🚀 Importing demo data...\n');

    try {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Get or create default user
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log('   ⚠️ No user found. Please run pnpm seed first.');
            return;
        }

        // Get or create ecommerce theme
        let theme = await prisma.theme.findFirst({ where: { slug: 'ecommerce' } });
        if (!theme) {
            theme = await prisma.theme.create({
                data: { name: 'Ecommerce', slug: 'ecommerce', version: '1.0.0', path: 'ecommerce', isActive: true }
            });
        }

        // Import Product Categories
        console.log('📁 Importing product categories...');
        for (const cat of data.productCategories || []) {
            await prisma.productCategory.upsert({
                where: { slug: cat.slug },
                update: { name: cat.name, description: cat.description },
                create: { name: cat.name, slug: cat.slug, description: cat.description || '' }
            });
        }
        console.log(`   ✅ ${data.productCategories?.length || 0} product categories`);

        // Import Post Categories
        console.log('📁 Importing post categories...');
        for (const cat of data.postCategories || []) {
            await prisma.postCategory.upsert({
                where: { slug: cat.slug },
                update: { name: cat.name, description: cat.description },
                create: { name: cat.name, slug: cat.slug, description: cat.description || '' }
            });
        }
        console.log(`   ✅ ${data.postCategories?.length || 0} post categories`);

        // Import Products
        console.log('📦 Importing products...');
        for (const product of data.products || []) {
            const category = product.categorySlug
                ? await prisma.productCategory.findUnique({ where: { slug: product.categorySlug } })
                : null;

            await prisma.product.upsert({
                where: { slug: product.slug },
                update: {
                    name: product.name,
                    shortDesc: product.shortDesc || '',
                    description: product.description || {},
                    price: product.price,
                    salePrice: product.salePrice || null,
                    sku: product.sku || product.slug.toUpperCase(),
                    stock: product.stock || 100,
                    images: product.images || [],
                    isFeatured: product.isFeatured || false,
                    status: 'ACTIVE',
                    categoryId: category?.id || null,
                },
                create: {
                    name: product.name,
                    slug: product.slug,
                    shortDesc: product.shortDesc || '',
                    description: product.description || {},
                    price: product.price,
                    salePrice: product.salePrice || null,
                    sku: product.sku || product.slug.toUpperCase(),
                    stock: product.stock || 100,
                    images: product.images || [],
                    isFeatured: product.isFeatured || false,
                    status: 'ACTIVE',
                    categoryId: category?.id || null,
                }
            });
        }
        console.log(`   ✅ ${data.products?.length || 0} products`);

        // Import Posts
        console.log('📝 Importing posts...');
        for (const post of data.posts || []) {
            const category = post.categorySlug
                ? await prisma.postCategory.findUnique({ where: { slug: post.categorySlug } })
                : null;

            await prisma.post.upsert({
                where: { slug: post.slug },
                update: {
                    title: post.title,
                    excerpt: post.excerpt || '',
                    content: post.content || {},
                    featuredImage: post.featuredImage || '',
                    tags: post.tags || '',
                    isFeatured: post.isFeatured || false,
                    status: 'PUBLISHED',
                    categoryId: category?.id || null,
                    authorId: user.id,
                },
                create: {
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt || '',
                    content: post.content || {},
                    featuredImage: post.featuredImage || '',
                    tags: post.tags || '',
                    isFeatured: post.isFeatured || false,
                    status: 'PUBLISHED',
                    categoryId: category?.id || null,
                    authorId: user.id,
                }
            });
        }
        console.log(`   ✅ ${data.posts?.length || 0} posts`);

        // Import Pages (including homepage with sections)
        console.log('📄 Importing pages...');
        for (const page of data.pages || []) {
            await prisma.page.upsert({
                where: { slug: page.slug },
                update: {
                    title: page.title,
                    template: page.template || 'page',
                    content: page.content || {},
                    isHomepage: page.isHomepage || page.slug === 'home',
                    status: 'PUBLISHED',
                    themeId: theme.id,
                    authorId: user.id,
                },
                create: {
                    title: page.title,
                    slug: page.slug,
                    template: page.template || 'page',
                    content: page.content || {},
                    isHomepage: page.isHomepage || page.slug === 'home',
                    status: 'PUBLISHED',
                    themeId: theme.id,
                    authorId: user.id,
                }
            });
        }
        console.log(`   ✅ ${data.pages?.length || 0} pages`);

        console.log('\n✨ Demo data imported successfully!');
        console.log('\nTo view:');
        console.log('  - Products: http://localhost:3000/products');
        console.log('  - Blog: http://localhost:3000/blog');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

importDemoData();
