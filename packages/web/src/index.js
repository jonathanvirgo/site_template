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

        // Configure nunjucks for this theme
        configureNunjucks(theme.path);

        // Get settings
        const settings = await apiCall('/settings') || {};

        // Get menus
        const menus = {};
        // Fetch menus if available
        try {
            const mainMenu = await apiCall('/menus/main-menu');
            if (mainMenu) menus.main = mainMenu.items;
            const footerMenu = await apiCall('/menus/footer-menu');
            if (footerMenu) menus.footer = footerMenu.items;
        } catch (e) {
            // Menus may not exist yet
        }

        // Add common data to res.locals
        res.locals.theme = theme;
        res.locals.settings = settings;
        res.locals.menus = menus;
        res.locals.currentPath = req.path;
        res.locals.year = new Date().getFullYear();

        next();
    } catch (error) {
        console.error('Middleware error:', error);
        next(error);
    }
});

// Home page
app.get('/', async (req, res, next) => {
    try {
        // Try to find homepage
        const pages = await apiCall('/pages?status=PUBLISHED');
        let page = pages?.find(p => p.isHomepage);

        if (!page) {
            page = pages?.find(p => p.slug === 'home');
        }

        if (!page) {
            // No homepage, show default
            return res.render('home.njk', {
                page: {
                    title: 'Welcome',
                    content: { blocks: [] }
                }
            });
        }

        const template = page.template || 'home';
        res.render(`${template}.njk`, { page });
    } catch (error) {
        next(error);
    }
});

// Dynamic page routing
app.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Fetch page by slug
        const page = await apiCall(`/pages/${slug}`);

        if (!page) {
            return res.status(404).render('404.njk', {
                page: { title: 'Page Not Found' }
            });
        }

        // Only show published pages
        if (page.status !== 'PUBLISHED') {
            return res.status(404).render('404.njk', {
                page: { title: 'Page Not Found' }
            });
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

        const page = await apiCall(`/pages/${slug}`);

        if (!page || page.status !== 'PUBLISHED') {
            return res.status(404).render('404.njk', {
                page: { title: 'Page Not Found' }
            });
        }

        const template = page.template || 'page';
        res.render(`${template}.njk`, { page, parentSlug: parent });
    } catch (error) {
        next(error);
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404.njk', {
        page: { title: 'Page Not Found' }
    });
});

// Error handler
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
