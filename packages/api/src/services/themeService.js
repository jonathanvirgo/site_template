import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';
import { downloadImage } from './imageService.js';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEMES_DIR = path.join(__dirname, '../../../../themes');

/**
 * Get all themes from database and filesystem
 */
export async function getAllThemes(forceRefresh = false) {
    // Scan themes directory
    if (!fs.existsSync(THEMES_DIR)) {
        fs.mkdirSync(THEMES_DIR, { recursive: true });
        return [];
    }

    const themeFolders = fs.readdirSync(THEMES_DIR).filter(f => {
        const themePath = path.join(THEMES_DIR, f);
        return fs.statSync(themePath).isDirectory() &&
            fs.existsSync(path.join(themePath, 'theme.json'));
    });

    // Sync with database
    for (const folder of themeFolders) {
        const themeInfo = await getThemeInfo(folder);
        if (themeInfo) {
            await prisma.theme.upsert({
                where: { slug: themeInfo.slug || folder },
                update: {
                    name: themeInfo.name,
                    description: themeInfo.description,
                    thumbnail: themeInfo.thumbnail,
                    version: themeInfo.version,
                    features: themeInfo.features || {},
                    path: folder,
                },
                create: {
                    name: themeInfo.name,
                    slug: themeInfo.slug || folder,
                    description: themeInfo.description,
                    thumbnail: themeInfo.thumbnail,
                    version: themeInfo.version || '1.0.0',
                    features: themeInfo.features || {},
                    path: folder,
                    isActive: false,
                }
            });
        }
    }

    // Get all themes from database
    const themes = await prisma.theme.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { pages: true }
            }
        }
    });

    // Enrich with filesystem data
    return themes.map(theme => {
        const demoPath = path.join(THEMES_DIR, theme.path, 'demo', 'data.json');
        const hasDemo = fs.existsSync(demoPath);

        return {
            ...theme,
            hasDemo,
            thumbnailUrl: theme.thumbnail
                ? `/themes/${theme.path}/${theme.thumbnail}`
                : null
        };
    });
}

/**
 * Get theme info from filesystem
 */
export async function getThemeInfo(themePath) {
    const themeJsonPath = path.join(THEMES_DIR, themePath, 'theme.json');

    if (!fs.existsSync(themeJsonPath)) {
        return null;
    }

    try {
        const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));

        // Get available templates
        const templatesDir = path.join(THEMES_DIR, themePath, 'templates');
        let templates = [];

        if (fs.existsSync(templatesDir)) {
            templates = fs.readdirSync(templatesDir)
                .filter(f => f.endsWith('.njk') && !f.startsWith('_'))
                .map(f => f.replace('.njk', ''));
        }

        // Check for demo data
        const demoPath = path.join(THEMES_DIR, themePath, 'demo', 'data.json');
        const hasDemo = fs.existsSync(demoPath);
        let demoInfo = null;

        if (hasDemo) {
            const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
            demoInfo = {
                pages: demoData.pages?.length || 0,
                images: demoData.images?.length || 0,
                menus: demoData.menus?.length || 0,
            };
        }

        return {
            ...themeData,
            templates,
            hasDemo,
            demoInfo,
        };
    } catch (error) {
        console.error(`Error reading theme ${themePath}:`, error);
        return null;
    }
}

/**
 * Import demo data for a theme
 */
export async function importDemoData(theme, userId) {
    const demoPath = path.join(THEMES_DIR, theme.path, 'demo', 'data.json');

    if (!fs.existsSync(demoPath)) {
        throw new Error('No demo data available for this theme');
    }

    const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
    const results = {
        pages: 0,
        images: 0,
        menus: 0,
        settings: 0,
        postCategories: 0,
        posts: 0,
        productCategories: 0,
        products: 0,
    };

    // Import images first (download from URLs)
    const imageMap = {}; // Map old URLs to new local paths

    if (demoData.images && Array.isArray(demoData.images)) {
        for (const image of demoData.images) {
            try {
                const localPath = await downloadImage(
                    image.url,
                    image.filename || `demo-${Date.now()}.jpg`
                );
                imageMap[image.placeholder || image.url] = localPath;

                // Save to media library
                await prisma.media.create({
                    data: {
                        filename: path.basename(localPath),
                        originalName: image.originalName || path.basename(localPath),
                        path: localPath,
                        url: `/uploads/${path.basename(localPath)}`,
                        mimetype: image.mimetype || 'image/jpeg',
                        size: image.size || 0,
                        width: image.width,
                        height: image.height,
                        alt: image.alt || '',
                    }
                });

                results.images++;
            } catch (error) {
                console.error(`Failed to download image ${image.url}:`, error.message);
            }
        }
    }

    // Helper function to replace image placeholders
    const replaceImagePlaceholders = (obj) => {
        if (!obj) return obj;
        let result = typeof obj === 'string' ? obj : JSON.stringify(obj);
        for (const [placeholder, localPath] of Object.entries(imageMap)) {
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `/uploads/${path.basename(localPath)}`);
        }
        return typeof obj === 'string' ? result : JSON.parse(result);
    };

    // Import pages
    if (demoData.pages && Array.isArray(demoData.pages)) {
        for (const pageData of demoData.pages) {
            try {
                const content = replaceImagePlaceholders(pageData.content);
                const featuredImage = replaceImagePlaceholders(pageData.featuredImage);
                const slug = pageData.slug || slugify(pageData.title, { lower: true, strict: true });

                await prisma.page.upsert({
                    where: { slug },
                    update: {
                        title: pageData.title,
                        content,
                        template: pageData.template || 'page',
                        excerpt: pageData.excerpt,
                        featuredImage,
                        status: 'PUBLISHED',
                        isHomepage: pageData.isHomepage || false,
                        seoTitle: pageData.seoTitle || pageData.title,
                        seoDesc: pageData.seoDesc || pageData.excerpt,
                        themeId: theme.id,
                    },
                    create: {
                        title: pageData.title,
                        slug,
                        content,
                        template: pageData.template || 'page',
                        excerpt: pageData.excerpt,
                        featuredImage,
                        status: 'PUBLISHED',
                        isHomepage: pageData.isHomepage || false,
                        seoTitle: pageData.seoTitle || pageData.title,
                        seoDesc: pageData.seoDesc || pageData.excerpt,
                        themeId: theme.id,
                        authorId: userId,
                    }
                });

                results.pages++;
            } catch (error) {
                console.error(`Failed to import page ${pageData.title}:`, error.message);
            }
        }
    }

    // Import menus
    if (demoData.menus && Array.isArray(demoData.menus)) {
        for (const menuData of demoData.menus) {
            try {
                await prisma.menu.upsert({
                    where: { slug: menuData.slug },
                    update: {
                        name: menuData.name,
                        items: menuData.items,
                        location: menuData.location,
                    },
                    create: {
                        name: menuData.name,
                        slug: menuData.slug,
                        items: menuData.items,
                        location: menuData.location,
                    }
                });
                results.menus++;
            } catch (error) {
                console.error(`Failed to import menu ${menuData.name}:`, error.message);
            }
        }
    }

    // Import settings
    if (demoData.settings && typeof demoData.settings === 'object') {
        for (const [key, value] of Object.entries(demoData.settings)) {
            try {
                await prisma.setting.upsert({
                    where: { key },
                    update: { value: { value } },
                    create: { key, value: { value } }
                });
                results.settings++;
            } catch (error) {
                console.error(`Failed to import setting ${key}:`, error.message);
            }
        }
    }

    // Import post categories
    const postCategoryMap = {}; // slug -> id
    if (demoData.postCategories && Array.isArray(demoData.postCategories)) {
        for (const catData of demoData.postCategories) {
            try {
                const slug = catData.slug || slugify(catData.name, { lower: true, strict: true });
                const image = replaceImagePlaceholders(catData.image);

                const category = await prisma.postCategory.upsert({
                    where: { slug },
                    update: {
                        name: catData.name,
                        description: catData.description,
                        image,
                    },
                    create: {
                        name: catData.name,
                        slug,
                        description: catData.description,
                        image,
                        sortOrder: catData.sortOrder || 0,
                    }
                });
                postCategoryMap[slug] = category.id;
                results.postCategories++;
            } catch (error) {
                console.error(`Failed to import post category ${catData.name}:`, error.message);
            }
        }
    }

    // Import posts
    if (demoData.posts && Array.isArray(demoData.posts)) {
        for (const postData of demoData.posts) {
            try {
                const slug = postData.slug || slugify(postData.title, { lower: true, strict: true });
                const content = replaceImagePlaceholders(postData.content);
                const featuredImage = replaceImagePlaceholders(postData.featuredImage);
                const categoryId = postData.categorySlug ? postCategoryMap[postData.categorySlug] : null;

                await prisma.post.upsert({
                    where: { slug },
                    update: {
                        title: postData.title,
                        content,
                        excerpt: postData.excerpt,
                        featuredImage,
                        status: 'PUBLISHED',
                        isFeatured: postData.isFeatured || false,
                        tags: postData.tags || [],
                        seoTitle: postData.seoTitle || postData.title,
                        seoDesc: postData.seoDesc || postData.excerpt,
                        categoryId,
                        publishedAt: new Date(),
                    },
                    create: {
                        title: postData.title,
                        slug,
                        content,
                        excerpt: postData.excerpt,
                        featuredImage,
                        status: 'PUBLISHED',
                        isFeatured: postData.isFeatured || false,
                        tags: postData.tags || [],
                        seoTitle: postData.seoTitle || postData.title,
                        seoDesc: postData.seoDesc || postData.excerpt,
                        categoryId,
                        authorId: userId,
                        publishedAt: new Date(),
                    }
                });

                results.posts++;
            } catch (error) {
                console.error(`Failed to import post ${postData.title}:`, error.message);
            }
        }
    }

    // Import product categories
    const productCategoryMap = {}; // slug -> id
    if (demoData.productCategories && Array.isArray(demoData.productCategories)) {
        for (const catData of demoData.productCategories) {
            try {
                const slug = catData.slug || slugify(catData.name, { lower: true, strict: true });
                const image = replaceImagePlaceholders(catData.image);

                const category = await prisma.productCategory.upsert({
                    where: { slug },
                    update: {
                        name: catData.name,
                        description: catData.description,
                        image,
                    },
                    create: {
                        name: catData.name,
                        slug,
                        description: catData.description,
                        image,
                        sortOrder: catData.sortOrder || 0,
                    }
                });
                productCategoryMap[slug] = category.id;
                results.productCategories++;
            } catch (error) {
                console.error(`Failed to import product category ${catData.name}:`, error.message);
            }
        }
    }

    // Import products
    if (demoData.products && Array.isArray(demoData.products)) {
        for (const prodData of demoData.products) {
            try {
                const slug = prodData.slug || slugify(prodData.name, { lower: true, strict: true });
                const description = replaceImagePlaceholders(prodData.description);
                const images = (prodData.images || []).map(img => replaceImagePlaceholders(img));
                const categoryId = prodData.categorySlug ? productCategoryMap[prodData.categorySlug] : null;

                await prisma.product.upsert({
                    where: { slug },
                    update: {
                        name: prodData.name,
                        description,
                        price: prodData.price || 0,
                        salePrice: prodData.salePrice,
                        sku: prodData.sku,
                        images,
                        stock: prodData.stock || 0,
                        status: 'PUBLISHED',
                        isFeatured: prodData.isFeatured || false,
                        specifications: prodData.specifications || {},
                        seoTitle: prodData.seoTitle || prodData.name,
                        seoDesc: prodData.seoDesc,
                        categoryId,
                    },
                    create: {
                        name: prodData.name,
                        slug,
                        description,
                        price: prodData.price || 0,
                        salePrice: prodData.salePrice,
                        sku: prodData.sku,
                        images,
                        stock: prodData.stock || 0,
                        status: 'PUBLISHED',
                        isFeatured: prodData.isFeatured || false,
                        specifications: prodData.specifications || {},
                        seoTitle: prodData.seoTitle || prodData.name,
                        seoDesc: prodData.seoDesc,
                        categoryId,
                    }
                });

                results.products++;
            } catch (error) {
                console.error(`Failed to import product ${prodData.name}:`, error.message);
            }
        }
    }

    return results;
}

/**
 * Get active theme
 */
export async function getActiveTheme() {
    const theme = await prisma.theme.findFirst({
        where: { isActive: true }
    });

    if (!theme) {
        // Return default theme
        const defaultTheme = await prisma.theme.findFirst({
            where: { slug: 'developer-default' }
        });
        return defaultTheme;
    }

    return theme;
}

export default {
    getAllThemes,
    getThemeInfo,
    importDemoData,
    getActiveTheme,
};
