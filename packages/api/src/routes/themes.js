import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getThemeInfo, getAllThemes, importDemoData } from '../services/themeService.js';

const router = Router();

// Get all themes
router.get('/', async (req, res, next) => {
    try {
        const themes = await getAllThemes();
        res.json({
            success: true,
            data: themes
        });
    } catch (error) {
        next(error);
    }
});

// Get single theme
router.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const theme = await prisma.theme.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { pages: true }
                }
            }
        });

        if (!theme) {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }

        // Get additional theme info from filesystem
        const themeInfo = await getThemeInfo(theme.path);

        res.json({
            success: true,
            data: {
                ...theme,
                ...themeInfo
            }
        });
    } catch (error) {
        next(error);
    }
});

// Activate theme
router.post('/:slug/activate', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Deactivate all themes first
        await prisma.theme.updateMany({
            data: { isActive: false }
        });

        // Activate the selected theme
        const theme = await prisma.theme.update({
            where: { slug },
            data: { isActive: true }
        });

        res.json({
            success: true,
            message: `Theme "${theme.name}" activated successfully`,
            data: theme
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }
        next(error);
    }
});

// Import demo data for theme
router.post('/:slug/import-demo', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { slug } = req.params;

        const theme = await prisma.theme.findUnique({
            where: { slug }
        });

        if (!theme) {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }

        const result = await importDemoData(theme, req.user.id);

        res.json({
            success: true,
            message: 'Demo data imported successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// Update theme settings
router.put('/:slug/settings', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { settings } = req.body;

        const theme = await prisma.theme.update({
            where: { slug },
            data: {
                settings: settings || {}
            }
        });

        res.json({
            success: true,
            message: 'Theme settings updated',
            data: theme
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Theme not found'
            });
        }
        next(error);
    }
});

// Refresh themes (scan filesystem for new themes)
router.post('/refresh', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const themes = await getAllThemes(true); // Force refresh
        res.json({
            success: true,
            message: `Found ${themes.length} themes`,
            data: themes
        });
    } catch (error) {
        next(error);
    }
});

export default router;
