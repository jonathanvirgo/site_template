import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import slugify from 'slugify';

const router = Router();

// Get all pages
router.get('/', async (req, res, next) => {
    try {
        const { status, themeId, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (themeId) where.themeId = parseInt(themeId);

        const [pages, total] = await Promise.all([
            prisma.page.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, name: true, email: true }
                    },
                    theme: {
                        select: { id: true, name: true, slug: true }
                    }
                },
                orderBy: [
                    { isHomepage: 'desc' },
                    { sortOrder: 'asc' },
                    { createdAt: 'desc' }
                ],
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.page.count({ where })
        ]);

        res.json({
            success: true,
            data: pages,
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

// Get single page by ID or slug
router.get('/:identifier', async (req, res, next) => {
    try {
        const { identifier } = req.params;

        const isId = /^\d+$/.test(identifier);

        const page = await prisma.page.findFirst({
            where: isId
                ? { id: parseInt(identifier) }
                : { slug: identifier },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                theme: {
                    select: { id: true, name: true, slug: true }
                },
                children: {
                    select: { id: true, title: true, slug: true }
                },
                parent: {
                    select: { id: true, title: true, slug: true }
                }
            }
        });

        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
});

// Create new page
router.post('/', authenticate, async (req, res, next) => {
    try {
        const {
            title,
            slug: customSlug,
            content,
            template,
            excerpt,
            featuredImage,
            status,
            isHomepage,
            seoTitle,
            seoDesc,
            seoKeywords,
            themeId,
            parentId,
            sortOrder
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        const slug = customSlug || slugify(title, { lower: true, strict: true });

        // Check slug uniqueness
        const existing = await prisma.page.findUnique({ where: { slug } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists'
            });
        }

        // If setting as homepage, unset other homepages
        if (isHomepage) {
            await prisma.page.updateMany({
                where: { isHomepage: true },
                data: { isHomepage: false }
            });
        }

        const page = await prisma.page.create({
            data: {
                title,
                slug,
                content: content || null,
                template: template || 'page',
                excerpt,
                featuredImage,
                status: status || 'DRAFT',
                isHomepage: isHomepage || false,
                seoTitle: seoTitle || title,
                seoDesc: seoDesc || excerpt,
                seoKeywords,
                themeId: themeId ? parseInt(themeId) : null,
                parentId: parentId ? parseInt(parentId) : null,
                sortOrder: sortOrder || 0,
                authorId: req.user.id,
            },
            include: {
                author: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
});

// Update page
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug: customSlug,
            content,
            template,
            excerpt,
            featuredImage,
            status,
            isHomepage,
            seoTitle,
            seoDesc,
            seoKeywords,
            themeId,
            parentId,
            sortOrder
        } = req.body;

        const existing = await prisma.page.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        // Check slug uniqueness if changed
        if (customSlug && customSlug !== existing.slug) {
            const slugExists = await prisma.page.findUnique({ where: { slug: customSlug } });
            if (slugExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug already exists'
                });
            }
        }

        // If setting as homepage, unset other homepages
        if (isHomepage && !existing.isHomepage) {
            await prisma.page.updateMany({
                where: { isHomepage: true },
                data: { isHomepage: false }
            });
        }

        const page = await prisma.page.update({
            where: { id: parseInt(id) },
            data: {
                ...(title && { title }),
                ...(customSlug && { slug: customSlug }),
                ...(content !== undefined && { content }),
                ...(template && { template }),
                ...(excerpt !== undefined && { excerpt }),
                ...(featuredImage !== undefined && { featuredImage }),
                ...(status && { status }),
                ...(isHomepage !== undefined && { isHomepage }),
                ...(seoTitle !== undefined && { seoTitle }),
                ...(seoDesc !== undefined && { seoDesc }),
                ...(seoKeywords !== undefined && { seoKeywords }),
                ...(themeId !== undefined && { themeId: themeId ? parseInt(themeId) : null }),
                ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null }),
                ...(sortOrder !== undefined && { sortOrder }),
            },
            include: {
                author: {
                    select: { id: true, name: true }
                },
                theme: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
});

// Delete page
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.page.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        next(error);
    }
});

// Publish page
router.post('/:id/publish', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await prisma.page.update({
            where: { id: parseInt(id) },
            data: { status: 'PUBLISHED' }
        });

        res.json({
            success: true,
            message: 'Page published successfully',
            data: page
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        next(error);
    }
});

// Unpublish (draft) page
router.post('/:id/unpublish', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await prisma.page.update({
            where: { id: parseInt(id) },
            data: { status: 'DRAFT' }
        });

        res.json({
            success: true,
            message: 'Page unpublished successfully',
            data: page
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        next(error);
    }
});

export default router;
