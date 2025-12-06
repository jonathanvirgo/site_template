import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all post categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.postCategory.findMany({
            include: {
                _count: { select: { posts: true } },
                parent: { select: { id: true, name: true } }
            },
            orderBy: { sortOrder: 'asc' }
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create post category
router.post('/categories', authenticate, async (req, res) => {
    try {
        const { name, slug, description, image, parentId, sortOrder } = req.body;
        const category = await prisma.postCategory.create({
            data: { name, slug, description, image, parentId, sortOrder }
        });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update post category
router.put('/categories/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image, parentId, sortOrder } = req.body;
        const category = await prisma.postCategory.update({
            where: { id: parseInt(id) },
            data: { name, slug, description, image, parentId, sortOrder }
        });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete post category
router.delete('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.postCategory.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const { status, category, featured, search, page = 1, limit = 10 } = req.query;
        const where = {};

        if (status) where.status = status;
        if (category) where.categoryId = parseInt(category);
        if (featured === 'true') where.isFeatured = true;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { excerpt: { contains: search } }
            ];
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    author: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.post.count({ where })
        ]);

        res.json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findFirst({
            where: {
                OR: [
                    { id: parseInt(id) || 0 },
                    { slug: id }
                ]
            },
            include: {
                category: true,
                author: { select: { id: true, name: true, avatar: true } }
            }
        });

        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        // Increment views
        await prisma.post.update({
            where: { id: post.id },
            data: { views: { increment: 1 } }
        });

        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create post
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, slug, content, excerpt, featuredImage, status, categoryId, tags, isFeatured, seoTitle, seoDesc } = req.body;

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                excerpt,
                featuredImage,
                status: status || 'DRAFT',
                categoryId: categoryId ? parseInt(categoryId) : null,
                authorId: req.user.id,
                tags,
                isFeatured: isFeatured || false,
                seoTitle,
                seoDesc,
                publishedAt: status === 'PUBLISHED' ? new Date() : null
            },
            include: { category: true, author: { select: { id: true, name: true } } }
        });

        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update post
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, content, excerpt, featuredImage, status, categoryId, tags, isFeatured, seoTitle, seoDesc } = req.body;

        const existingPost = await prisma.post.findUnique({ where: { id: parseInt(id) } });

        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: {
                title,
                slug,
                content,
                excerpt,
                featuredImage,
                status,
                categoryId: categoryId ? parseInt(categoryId) : null,
                tags,
                isFeatured,
                seoTitle,
                seoDesc,
                publishedAt: status === 'PUBLISHED' && !existingPost.publishedAt ? new Date() : existingPost.publishedAt
            },
            include: { category: true, author: { select: { id: true, name: true } } }
        });

        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.post.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Publish/Unpublish post
router.post('/:id/publish', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { status: 'PUBLISHED', publishedAt: new Date() }
        });
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:id/unpublish', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { status: 'DRAFT' }
        });
        res.json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
