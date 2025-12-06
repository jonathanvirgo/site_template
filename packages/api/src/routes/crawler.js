import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { crawlUrl, crawlWebsite } from '../services/crawlerService.js';

const router = Router();

// Start a new crawl job
router.post('/crawl', authenticate, async (req, res, next) => {
    try {
        const { url, options = {} } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        // Create crawl job record
        const crawlJob = await prisma.crawledContent.create({
            data: {
                sourceUrl: url,
                status: 'PROCESSING',
            }
        });

        // Start crawling (async)
        crawlUrl(url, options)
            .then(async (result) => {
                await prisma.crawledContent.update({
                    where: { id: crawlJob.id },
                    data: {
                        title: result.title,
                        content: result.content,
                        images: result.images,
                        metadata: result.metadata,
                        status: 'COMPLETED',
                    }
                });
            })
            .catch(async (error) => {
                await prisma.crawledContent.update({
                    where: { id: crawlJob.id },
                    data: {
                        status: 'FAILED',
                        errorMsg: error.message,
                    }
                });
            });

        res.status(202).json({
            success: true,
            message: 'Crawl job started',
            data: {
                id: crawlJob.id,
                status: 'PROCESSING'
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get all crawl jobs
router.get('/jobs', authenticate, async (req, res, next) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;

        const [jobs, total] = await Promise.all([
            prisma.crawledContent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.crawledContent.count({ where })
        ]);

        res.json({
            success: true,
            data: jobs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get single crawl job
router.get('/jobs/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const job = await prisma.crawledContent.findUnique({
            where: { id: parseInt(id) }
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Crawl job not found'
            });
        }

        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// Import crawled content as page
router.post('/:id/import', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, slug, template, themeId } = req.body;

        const crawledContent = await prisma.crawledContent.findUnique({
            where: { id: parseInt(id) }
        });

        if (!crawledContent) {
            return res.status(404).json({
                success: false,
                message: 'Crawled content not found'
            });
        }

        if (crawledContent.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot import: crawl job not completed'
            });
        }

        // Create page from crawled content
        const page = await prisma.page.create({
            data: {
                title: title || crawledContent.title || 'Imported Page',
                slug: slug || `imported-${Date.now()}`,
                content: {
                    blocks: [
                        {
                            type: 'html',
                            content: crawledContent.content
                        }
                    ]
                },
                template: template || 'page',
                status: 'DRAFT',
                themeId: themeId ? parseInt(themeId) : null,
                authorId: req.user.id,
                seoTitle: crawledContent.title,
                seoDesc: crawledContent.metadata?.description,
            }
        });

        // Mark as imported
        await prisma.crawledContent.update({
            where: { id: parseInt(id) },
            data: { status: 'IMPORTED' }
        });

        res.json({
            success: true,
            message: 'Content imported as page',
            data: page
        });
    } catch (error) {
        next(error);
    }
});

// Delete crawl job
router.delete('/jobs/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.crawledContent.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Crawl job deleted'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Crawl job not found'
            });
        }
        next(error);
    }
});

export default router;
