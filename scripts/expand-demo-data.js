/**
 * Script to expand demo data with more products and posts
 * Run: node scripts/expand-demo-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../themes/ecommerce/demo/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Additional product images
const newImages = [
    { placeholder: "{{product_21}}", url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80", filename: "product-shoes2.jpg", alt: "Running shoes" },
    { placeholder: "{{product_22}}", url: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&q=80", filename: "product-monitor.jpg", alt: "Monitor" },
    { placeholder: "{{product_23}}", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80", filename: "product-monitor2.jpg", alt: "Gaming monitor" },
    { placeholder: "{{product_24}}", url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80", filename: "product-tablet.jpg", alt: "Tablet" },
    { placeholder: "{{product_25}}", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", filename: "product-laptop.jpg", alt: "Laptop" },
    { placeholder: "{{blog_6}}", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", filename: "blog-tech.jpg", alt: "Technology" },
    { placeholder: "{{blog_7}}", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80", filename: "blog-lifestyle2.jpg", alt: "Work lifestyle" },
];
data.images.push(...newImages);

// New categories
data.productCategories.push(
    { name: "Sports & Fitness", slug: "sports-fitness", description: "Athletic gear and fitness equipment" },
    { name: "Beauty & Care", slug: "beauty-care", description: "Beauty and personal care products" }
);
data.postCategories.push(
    { name: "Tech News", slug: "tech-news", description: "Latest technology updates" },
    { name: "Wellness", slug: "wellness", description: "Health and wellness tips" }
);

// Additional products (adding 13 more to reach 35)
const newProducts = [
    { name: "Smart Fitness Tracker", slug: "smart-fitness-tracker", categorySlug: "sports-fitness", isFeatured: true, price: 129.00, sku: "FIT-023", stock: 80, images: ["{{product_10}}"], shortDesc: "Track your health metrics 24/7", description: { blocks: [{ type: "paragraph", data: { text: "Advanced fitness tracking with heart rate and sleep monitoring." } }] }, specs: { Battery: "7 days", "Water Resistance": "50m" } },
    { name: "Yoga Mat Premium", slug: "yoga-mat-premium", categorySlug: "sports-fitness", isFeatured: false, price: 79.00, sku: "FIT-024", stock: 60, images: ["{{product_7}}"], shortDesc: "Non-slip eco-friendly yoga mat", description: { blocks: [{ type: "paragraph", data: { text: "Premium TPE material for comfort." } }] }, specs: { Material: "TPE", Size: "183x61cm" } },
    { name: "Resistance Bands Set", slug: "resistance-bands-set", categorySlug: "sports-fitness", isFeatured: false, price: 35.00, sku: "FIT-025", stock: 100, images: ["{{product_9}}"], shortDesc: "5-piece resistance band set", description: { blocks: [{ type: "paragraph", data: { text: "Complete set for home workouts." } }] }, specs: { Pieces: "5 bands", Levels: "Light to Heavy" } },
    { name: "Face Serum Vitamin C", slug: "face-serum-vitamin-c", categorySlug: "beauty-care", isFeatured: true, price: 45.00, sku: "BEA-026", stock: 70, images: ["{{product_17}}"], shortDesc: "Brightening vitamin C serum", description: { blocks: [{ type: "paragraph", data: { text: "Pure vitamin C for glowing skin." } }] }, specs: { Size: "30ml", "Vitamin C": "20%" } },
    { name: "Hair Dryer Pro", slug: "hair-dryer-pro", categorySlug: "beauty-care", isFeatured: false, price: 159.00, sku: "BEA-027", stock: 35, images: ["{{product_11}}"], shortDesc: "Professional ionic hair dryer", description: { blocks: [{ type: "paragraph", data: { text: "Fast drying with ionic technology." } }] }, specs: { Power: "1800W", Settings: "3 heat/2 speed" } },
    { name: "USB-C Hub 10-in-1", slug: "usb-c-hub-10-in-1", categorySlug: "electronics", isFeatured: false, price: 69.00, sku: "TECH-028", stock: 90, images: ["{{product_18}}"], shortDesc: "Complete connectivity solution", description: { blocks: [{ type: "paragraph", data: { text: "All ports you need in one hub." } }] }, specs: { Ports: "10", Power: "100W PD" } },
    { name: "Webcam 4K Pro", slug: "webcam-4k-pro", categorySlug: "electronics", isFeatured: true, price: 149.00, sku: "TECH-029", stock: 45, images: ["{{product_3}}"], shortDesc: "4K webcam with auto-focus", description: { blocks: [{ type: "paragraph", data: { text: "Crystal clear video calls." } }] }, specs: { Resolution: "4K", FPS: "30fps" } },
    { name: "Portable Charger 20000mAh", slug: "portable-charger-20000", categorySlug: "electronics", isFeatured: false, price: 59.00, sku: "TECH-030", stock: 120, images: ["{{product_4}}"], shortDesc: "High capacity power bank", description: { blocks: [{ type: "paragraph", data: { text: "Charge your devices multiple times." } }] }, specs: { Capacity: "20000mAh", Ports: "3" } },
    { name: "Silk Scarf Designer", slug: "silk-scarf-designer", categorySlug: "fashion", isFeatured: false, price: 120.00, sku: "FASH-031", stock: 40, images: ["{{product_14}}"], shortDesc: "100% silk designer scarf", description: { blocks: [{ type: "paragraph", data: { text: "Handcrafted silk scarf." } }] }, specs: { Material: "100% Silk", Size: "90x90cm" } },
    { name: "Denim Jacket Classic", slug: "denim-jacket-classic", categorySlug: "fashion", isFeatured: true, price: 189.00, sku: "FASH-032", stock: 30, images: ["{{product_15}}"], shortDesc: "Classic fit denim jacket", description: { blocks: [{ type: "paragraph", data: { text: "Timeless denim style." } }] }, specs: { Material: "Cotton Denim", Fit: "Classic" } },
    { name: "Card Holder Minimalist", slug: "card-holder-minimalist", categorySlug: "accessories", isFeatured: false, price: 45.00, sku: "ACC-033", stock: 85, images: ["{{product_20}}"], shortDesc: "Slim card holder with RFID", description: { blocks: [{ type: "paragraph", data: { text: "Minimalist design for essentials." } }] }, specs: { Slots: "6", RFID: "Protected" } },
    { name: "Desk Lamp LED", slug: "desk-lamp-led", categorySlug: "home-living", isFeatured: false, price: 89.00, sku: "HOME-034", stock: 55, images: ["{{product_1}}"], shortDesc: "Adjustable LED desk lamp", description: { blocks: [{ type: "paragraph", data: { text: "Eye-care LED lighting." } }] }, specs: { Brightness: "5 levels", Color: "3 modes" } },
    { name: "Plant Pot Set Ceramic", slug: "plant-pot-set-ceramic", categorySlug: "home-living", isFeatured: false, price: 55.00, sku: "HOME-035", stock: 65, images: ["{{product_5}}"], shortDesc: "Set of 3 ceramic plant pots", description: { blocks: [{ type: "paragraph", data: { text: "Modern minimalist design." } }] }, specs: { Set: "3 pieces", Material: "Ceramic" } },
];
data.products.push(...newProducts);

// Additional posts (adding 15 more to reach 35)
const newPosts = [
    { title: "Best Fitness Gadgets of 2024", slug: "best-fitness-gadgets-2024", categorySlug: "tech-news", isFeatured: true, excerpt: "Top fitness technology to track your health goals.", featuredImage: "{{product_10}}", tags: "fitness,tech,gadgets", content: { blocks: [{ type: "paragraph", data: { text: "Explore the latest fitness technology innovations." } }] } },
    { title: "Morning Routines for Success", slug: "morning-routines-success", categorySlug: "wellness", isFeatured: false, excerpt: "Start your day right with these healthy habits.", featuredImage: "{{blog_7}}", tags: "wellness,lifestyle,habits", content: { blocks: [{ type: "paragraph", data: { text: "Building a strong morning routine sets the tone for your entire day." } }] } },
    { title: "Home Office Setup Guide 2024", slug: "home-office-setup-2024", categorySlug: "lifestyle", isFeatured: true, excerpt: "Create the perfect work-from-home environment.", featuredImage: "{{product_18}}", tags: "home,office,productivity", content: { blocks: [{ type: "paragraph", data: { text: "Essential tips for setting up your home office." } }] } },
    { title: "Smartphone Photography Tips", slug: "smartphone-photography-tips", categorySlug: "tech-news", isFeatured: false, excerpt: "Take professional photos with your phone.", featuredImage: "{{product_4}}", tags: "photography,smartphone,tips", content: { blocks: [{ type: "paragraph", data: { text: "Master mobile photography with these expert tips." } }] } },
    { title: "Mindfulness in Modern Life", slug: "mindfulness-modern-life", categorySlug: "wellness", isFeatured: true, excerpt: "Finding peace in a busy world.", featuredImage: "{{blog_4}}", tags: "mindfulness,wellness,mental health", content: { blocks: [{ type: "paragraph", data: { text: "Practical mindfulness techniques for everyday life." } }] } },
    { title: "Best Accessories Under $50", slug: "best-accessories-under-50", categorySlug: "shopping-tips", isFeatured: false, excerpt: "Affordable accessories that look expensive.", featuredImage: "{{product_6}}", tags: "accessories,budget,style", content: { blocks: [{ type: "paragraph", data: { text: "Quality accessories at affordable prices." } }] } },
    { title: "Men's Style Essentials 2024", slug: "mens-style-essentials-2024", categorySlug: "style-guide", isFeatured: false, excerpt: "Must-have items for the modern gentleman.", featuredImage: "{{blog_3}}", tags: "men,fashion,essentials", content: { blocks: [{ type: "paragraph", data: { text: "Build a versatile wardrobe with these essentials." } }] } },
    { title: "Smart Home Buying Guide", slug: "smart-home-buying-guide", categorySlug: "tech-news", isFeatured: false, excerpt: "Transform your home with smart technology.", featuredImage: "{{blog_6}}", tags: "smart home,tech,guide", content: { blocks: [{ type: "paragraph", data: { text: "Complete guide to smart home devices." } }] } },
    { title: "Fall Fashion Preview", slug: "fall-fashion-preview", categorySlug: "trends", isFeatured: true, excerpt: "What's trending this fall season.", featuredImage: "{{blog_2}}", tags: "fall,fashion,trends", content: { blocks: [{ type: "paragraph", data: { text: "Get ready for fall with these style trends." } }] } },
    { title: "Healthy Snacks for Work", slug: "healthy-snacks-work", categorySlug: "wellness", isFeatured: false, excerpt: "Fuel your workday with nutritious snacks.", featuredImage: "{{blog_1}}", tags: "health,snacks,work", content: { blocks: [{ type: "paragraph", data: { text: "Nutritious snack ideas for busy professionals." } }] } },
    { title: "Laptop Buying Guide 2024", slug: "laptop-buying-guide-2024", categorySlug: "product-reviews", isFeatured: true, excerpt: "Find the perfect laptop for your needs.", featuredImage: "{{product_18}}", tags: "laptop,tech,buying guide", content: { blocks: [{ type: "paragraph", data: { text: "Compare the best laptops of the year." } }] } },
    { title: "Weekend Outfit Ideas", slug: "weekend-outfit-ideas", categorySlug: "style-guide", isFeatured: false, excerpt: "Casual looks for your days off.", featuredImage: "{{blog_5}}", tags: "weekend,casual,outfits", content: { blocks: [{ type: "paragraph", data: { text: "Effortless style for your weekend activities." } }] } },
    { title: "Best Coffee Accessories", slug: "best-coffee-accessories", categorySlug: "product-reviews", isFeatured: false, excerpt: "Upgrade your coffee experience.", featuredImage: "{{product_1}}", tags: "coffee,accessories,home", content: { blocks: [{ type: "paragraph", data: { text: "Essential accessories for coffee lovers." } }] } },
    { title: "Winter Skincare Routine", slug: "winter-skincare-routine", categorySlug: "wellness", isFeatured: false, excerpt: "Protect your skin in cold weather.", featuredImage: "{{product_17}}", tags: "skincare,winter,beauty", content: { blocks: [{ type: "paragraph", data: { text: "Keep your skin hydrated during winter." } }] } },
    { title: "Gift Ideas for Tech Lovers", slug: "gift-ideas-tech-lovers", categorySlug: "shopping-tips", isFeatured: true, excerpt: "Perfect gifts for the tech enthusiast.", featuredImage: "{{product_12}}", tags: "gifts,tech,ideas", content: { blocks: [{ type: "paragraph", data: { text: "Top tech gifts for any occasion." } }] } },
];
data.posts.push(...newPosts);

// Write updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));

console.log('✅ Demo data expanded:');
console.log(`   Products: ${data.products.length}`);
console.log(`   Posts: ${data.posts.length}`);
console.log(`   Product Categories: ${data.productCategories.length}`);
console.log(`   Post Categories: ${data.postCategories.length}`);
