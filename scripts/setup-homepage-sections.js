/**
 * Script to update homepage with pre-configured sections for Visual Builder
 * Run: node scripts/setup-homepage-sections.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../themes/ecommerce/demo/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Find and update the Home page with pre-configured sections
const homePageIndex = data.pages.findIndex(p => p.slug === 'home');
if (homePageIndex !== -1) {
    data.pages[homePageIndex].content = {
        sections: [
            {
                id: 'section_hero_1',
                type: 'hero',
                order: 0,
                settings: {
                    title: 'Elevate Your Style',
                    subtitle: 'Discover curated products crafted for those who appreciate quality and modern design.',
                    tagline: 'Premium Collection',
                    backgroundImage: '{{hero_image}}',
                    overlayColor: 'rgba(0,0,0,0.4)',
                    textAlign: 'center',
                    buttons: [
                        { text: 'Shop Collection', url: '/products', style: 'primary' },
                        { text: 'Explore', url: '#featured', style: 'outline' }
                    ]
                }
            },
            {
                id: 'section_products_featured',
                type: 'product_grid',
                order: 1,
                settings: {
                    title: 'Featured Products',
                    subtitle: 'Hand-picked items from our latest collection',
                    categoryId: null,
                    limit: 4,
                    columns: 4,
                    showFeaturedOnly: true
                }
            },
            {
                id: 'section_categories_1',
                type: 'categories',
                order: 2,
                settings: {
                    title: 'Shop by Category',
                    subtitle: 'Find exactly what you\'re looking for',
                    type: 'product',
                    showCount: true
                }
            },
            {
                id: 'section_products_new',
                type: 'product_grid',
                order: 3,
                settings: {
                    title: 'New Arrivals',
                    subtitle: 'The latest additions to our collection',
                    categoryId: null,
                    limit: 8,
                    columns: 4,
                    showFeaturedOnly: false
                }
            },
            {
                id: 'section_banner_promo',
                type: 'banner',
                order: 4,
                settings: {
                    title: 'Summer Sale - Up to 50% Off',
                    subtitle: 'Limited time offer on selected items',
                    backgroundColor: '#0071e3',
                    textColor: '#ffffff',
                    buttonText: 'Shop Sale',
                    buttonUrl: '/products?sale=true'
                }
            },
            {
                id: 'section_posts_1',
                type: 'post_grid',
                order: 5,
                settings: {
                    title: 'From Our Blog',
                    subtitle: 'Tips, trends, and product insights',
                    categoryId: null,
                    limit: 3,
                    columns: 3,
                    showExcerpt: true
                }
            },
            {
                id: 'section_trust_1',
                type: 'trust_badges',
                order: 6,
                settings: {
                    title: '',
                    items: [
                        { icon: 'truck', title: 'Free Shipping', desc: 'On orders over $100' },
                        { icon: 'shield', title: 'Secure Payment', desc: '100% secure checkout' },
                        { icon: 'refresh', title: 'Easy Returns', desc: '30-day return policy' },
                        { icon: 'headphones', title: '24/7 Support', desc: 'Always here to help' }
                    ]
                }
            },
            {
                id: 'section_newsletter_1',
                type: 'newsletter',
                order: 7,
                settings: {
                    title: 'Stay in the Loop',
                    subtitle: 'Subscribe for exclusive offers, new arrivals, and style inspiration.',
                    buttonText: 'Subscribe'
                }
            }
        ]
    };
    console.log('✅ Homepage updated with 8 pre-configured sections');
}

// Write updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
console.log('✅ Demo data saved');
console.log('\nSections added:');
console.log('  1. Hero Banner');
console.log('  2. Featured Products (grid)');
console.log('  3. Product Categories');
console.log('  4. New Arrivals (grid)');
console.log('  5. Promotional Banner');
console.log('  6. Blog Posts (grid)');
console.log('  7. Trust Badges');
console.log('  8. Newsletter');
console.log('\n👉 Import demo data in admin to apply changes');
