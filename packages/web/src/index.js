import express from 'express';
import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.WEB_PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Paths
const THEMES_DIR = path.join(__dirname, '../../../themes');
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

// API Client
async function apiCall(endpoint) {
    try {
        const response = await fetch(`${API_URL}/api${endpoint}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        return null;
    }
}

// Get active theme
async function getActiveTheme() {
    const themes = await apiCall('/themes');
    if (!themes) return null;
    return themes.find(t => t.isActive) || themes[0];
}

// Configure Nunjucks
function configureNunjucks(themePath) {
    const env = nunjucks.configure([
        path.join(THEMES_DIR, themePath, 'templates'),
        path.join(THEMES_DIR, themePath, 'templates', 'layouts'),
    ], {
        autoescape: true,
        express: app,
        watch: process.env.NODE_ENV === 'development',
        noCache: process.env.NODE_ENV === 'development',
    });

    // Add custom filters
    env.addFilter('json', (value) => JSON.stringify(value, null, 2));
    env.addFilter('date', (value, format) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });
    env.addFilter('truncate', (str, length) => {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    });
    env.addFilter('currency', (value, symbol = '$') => {
        if (!value) return symbol + '0.00';
        return symbol + parseFloat(value).toFixed(2);
    });
    env.addFilter('readingTime', (content) => {
        if (!content) return '1 min read';
        const text = JSON.stringify(content);
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    });

    // Add startswith filter
    env.addFilter('startswith', (str, prefix) => {
        if (!str) return false;
        return str.startsWith(prefix);
    });

    return env;
}

// Static files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/themes', express.static(THEMES_DIR));

// Main middleware - load theme and common data
app.use(async (req, res, next) => {
    try {
        // Get active theme
        const theme = await getActiveTheme();
        if (!theme) {
            return res.status(500).send('No active theme found. Please activate a theme in the admin panel.');
        }

        // Debug log
        console.log(`[WEB] Using theme: ${theme.name} (path: ${theme.path})`);

        // Configure nunjucks for this theme
        configureNunjucks(theme.path);

        // Get settings
        const settings = await apiCall('/settings') || {};

        // Get menus
        const menus = {};
        try {
            const mainMenu = await apiCall('/menus/main-menu');
            if (mainMenu) menus.main = mainMenu.items;
            const footerMenu = await apiCall('/menus/footer-menu');
            if (footerMenu) menus.footer = footerMenu.items;
        } catch (e) {
            // Menus may not exist yet
        }

        // Get categories for navigation
        const postCategories = await apiCall('/posts/categories') || [];
        const productCategories = await apiCall('/products/categories') || [];

        // Add common data to res.locals
        res.locals.theme = theme;
        res.locals.settings = settings;
        res.locals.menus = menus;
        res.locals.postCategories = postCategories;
        res.locals.productCategories = productCategories;
        res.locals.currentPath = req.path;
        res.locals.year = new Date().getFullYear();

        next();
    } catch (error) {
        console.error('Middleware error:', error);
        next(error);
    }
});

// ==================== HOME PAGE ====================
app.get('/', async (req, res, next) => {
    try {
        // Get homepage
        const pages = await apiCall('/pages?status=PUBLISHED');
        let page = pages?.find(p => p.isHomepage) || pages?.find(p => p.slug === 'home');

        // Get featured posts (for static fallback)
        const posts = await apiCall('/posts?status=PUBLISHED&limit=6') || [];
        const featuredPosts = posts.filter(p => p.isFeatured).slice(0, 3);
        const recentPosts = posts.slice(0, 6);

        // Get featured products (for static fallback)
        const products = await apiCall('/products?status=ACTIVE&limit=8') || [];
        const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

        // Prepare section-specific data if page has dynamic sections
        let sectionProducts = {};
        let sectionPosts = {};
        let sectionCategories = {};

        if (page?.content?.sections) {
            for (const section of page.content.sections) {
                if (section.type === 'product_grid' || section.type === 'product_carousel') {
                    let url = `/products?status=ACTIVE&limit=${section.settings.limit || 4}`;
                    if (section.settings.categoryId) url += `&categoryId=${section.settings.categoryId}`;
                    if (section.settings.showFeaturedOnly) url += `&featured=true`;
                    sectionProducts[section.id] = await apiCall(url) || [];
                }
                if (section.type === 'post_grid' || section.type === 'post_slider') {
                    let url = `/posts?status=PUBLISHED&limit=${section.settings.limit || 3}`;
                    if (section.settings.categoryId) url += `&categoryId=${section.settings.categoryId}`;
                    sectionPosts[section.id] = await apiCall(url) || [];
                }
                if (section.type === 'categories') {
                    if (section.settings.type === 'product') {
                        sectionCategories[section.id] = res.locals.productCategories;
                    } else {
                        sectionCategories[section.id] = res.locals.postCategories;
                    }
                }
            }
        }

        if (!page) {
            return res.render('home.njk', {
                page: { title: 'Welcome', content: { blocks: [] } },
                posts: recentPosts,
                featuredPosts,
                products: featuredProducts,
                featuredProducts,
                sectionProducts,
                sectionPosts,
                sectionCategories
            });
        }

        const template = page.template || 'home';
        res.render(`${template}.njk`, {
            page,
            posts: recentPosts,
            featuredPosts,
            products: featuredProducts,
            featuredProducts,
            sectionProducts,
            sectionPosts,
            sectionCategories
        });
    } catch (error) {
        next(error);
    }
});

// ==================== BLOG / POSTS ====================
app.get('/blog', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;

        const posts = await apiCall(`/posts?status=PUBLISHED&limit=${limit}&page=${page}`) || [];
        const categories = await apiCall('/posts/categories') || [];
        const featuredPosts = posts.filter(p => p.isFeatured).slice(0, 3);

        res.render('blog.njk', {
            page: { title: 'Blog', slug: 'blog' },
            posts,
            featuredPosts,
            categories,
            currentPage: page,
            hasMore: posts.length === limit
        });
    } catch (error) {
        next(error);
    }
});

// Blog category
app.get('/blog/category/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 12;

        const categories = await apiCall('/posts/categories') || [];
        const category = categories.find(c => c.slug === slug);

        if (!category) {
            return res.status(404).render('404.njk', { page: { title: 'Category Not Found' } });
        }

        const posts = await apiCall(`/posts?status=PUBLISHED&categoryId=${category.id}&limit=${limit}&page=${page}`) || [];

        res.render('archive.njk', {
            page: { title: category.name, slug: `blog/category/${slug}` },
            category,
            posts,
            categories,
            currentPage: page,
            hasMore: posts.length === limit
        });
    } catch (error) {
        next(error);
    }
});

// Single blog post
app.get('/blog/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const post = await apiCall(`/posts/slug/${slug}`);

        if (!post || post.status !== 'PUBLISHED') {
            return res.status(404).render('404.njk', { page: { title: 'Post Not Found' } });
        }

        // Get related posts
        const relatedPosts = await apiCall(`/posts?status=PUBLISHED&categoryId=${post.categoryId}&limit=3`) || [];
        const filteredRelated = relatedPosts.filter(p => p.id !== post.id).slice(0, 3);

        res.render('single.njk', {
            page: { title: post.title, slug: `blog/${slug}` },
            post,
            relatedPosts: filteredRelated
        });
    } catch (error) {
        next(error);
    }
});

// ==================== PRODUCTS ====================
app.get('/products', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const categorySlug = req.query.category;

        let productsUrl = `/products?status=ACTIVE&limit=${limit}&page=${page}`;

        const categories = await apiCall('/products/categories') || [];
        let currentCategory = null;

        if (categorySlug) {
            currentCategory = categories.find(c => c.slug === categorySlug);
            if (currentCategory) {
                productsUrl += `&categoryId=${currentCategory.id}`;
            }
        }

        const products = await apiCall(productsUrl) || [];
        const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

        res.render('products.njk', {
            page: {
                title: currentCategory ? currentCategory.name : 'Products',
                slug: 'products'
            },
            products,
            featuredProducts,
            categories,
            currentCategory,
            currentPage: page,
            hasMore: products.length === limit
        });
    } catch (error) {
        next(error);
    }
});

// Product category
app.get('/products/category/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 12;

        const categories = await apiCall('/products/categories') || [];
        const category = categories.find(c => c.slug === slug);

        if (!category) {
            return res.status(404).render('404.njk', { page: { title: 'Category Not Found' } });
        }

        const products = await apiCall(`/products?status=ACTIVE&categoryId=${category.id}&limit=${limit}&page=${page}`) || [];

        res.render('products.njk', {
            page: { title: category.name, slug: `products/category/${slug}` },
            category,
            currentCategory: category,
            products,
            categories,
            currentPage: page,
            hasMore: products.length === limit
        });
    } catch (error) {
        next(error);
    }
});

// Single product
app.get('/products/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const product = await apiCall(`/products/slug/${slug}`);

        if (!product || product.status !== 'ACTIVE') {
            return res.status(404).render('404.njk', { page: { title: 'Product Not Found' } });
        }

        // Get related products
        const relatedProducts = await apiCall(`/products?status=ACTIVE&categoryId=${product.categoryId}&limit=4`) || [];
        const filteredRelated = relatedProducts.filter(p => p.id !== product.id).slice(0, 4);

        res.render('product.njk', {
            page: { title: product.name, slug: `products/${slug}` },
            product,
            relatedProducts: filteredRelated
        });
    } catch (error) {
        next(error);
    }
});

// ==================== STATIC PAGES ====================
app.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Skip if it looks like a file request
        if (slug.includes('.')) {
            return next();
        }

        // Fetch page by slug
        const page = await apiCall(`/pages/${slug}`);

        if (!page || page.status !== 'PUBLISHED') {
            return res.status(404).render('404.njk', { page: { title: 'Page Not Found' } });
        }

        const template = page.template || 'page';
        res.render(`${template}.njk`, { page });
    } catch (error) {
        next(error);
    }
});

// Nested pages (e.g., /services/web-development)
app.get('/:parent/:slug', async (req, res, next) => {
    try {
        const { parent, slug } = req.params;

        // Skip known routes
        if (['blog', 'products'].includes(parent)) {
            return next();
        }

        const page = await apiCall(`/pages/${slug}`);

        if (!page || page.status !== 'PUBLISHED') {
            return res.status(404).render('404.njk', { page: { title: 'Page Not Found' } });
        }

        const template = page.template || 'page';
        res.render(`${template}.njk`, { page, parentSlug: parent });
    } catch (error) {
        next(error);
    }
});

// ==================== ERROR HANDLERS ====================
app.use((req, res) => {
    res.status(404).render('404.njk', {
        page: { title: 'Page Not Found' }
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send(`
    <h1>Server Error</h1>
    <p>${process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'}</p>
  `);
});

app.listen(PORT, () => {
    console.log(`🌐 Web Server running at http://localhost:${PORT}`);
});

export default app;
