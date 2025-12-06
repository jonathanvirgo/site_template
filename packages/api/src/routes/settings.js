import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Get all settings
router.get('/', async (req, res, next) => {
    try {
        const settings = await prisma.setting.findMany();

        // Convert to key-value object
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value?.value ?? s.value;
        });

        res.json({
            success: true,
            data: settingsObj
        });
    } catch (error) {
        next(error);
    }
});

// Get single setting
router.get('/:key', async (req, res, next) => {
    try {
        const { key } = req.params;

        const setting = await prisma.setting.findUnique({
            where: { key }
        });

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        res.json({
            success: true,
            data: setting.value?.value ?? setting.value
        });
    } catch (error) {
        next(error);
    }
});

// Update setting
router.put('/:key', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: { value } },
            create: { key, value: { value } }
        });

        res.json({
            success: true,
            data: setting
        });
    } catch (error) {
        next(error);
    }
});

// Update multiple settings
router.put('/', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const settings = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Settings object required'
            });
        }

        const results = [];

        for (const [key, value] of Object.entries(settings)) {
            const setting = await prisma.setting.upsert({
                where: { key },
                update: { value: { value } },
                create: { key, value: { value } }
            });
            results.push(setting);
        }

        res.json({
            success: true,
            message: `Updated ${results.length} settings`,
            data: results
        });
    } catch (error) {
        next(error);
    }
});

// Delete setting
router.delete('/:key', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;

        await prisma.setting.delete({
            where: { key }
        });

        res.json({
            success: true,
            message: 'Setting deleted'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }
        next(error);
    }
});

export default router;
