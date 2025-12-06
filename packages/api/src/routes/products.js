import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all product categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.productCategory.findMany({
            include: {
                _count: { select: { products: true } },
                parent: { select: { id: true, name: true } }
            },
            orderBy: { sortOrder: 'asc' }
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create product category
router.post('/categories', authenticate, async (req, res) => {
    try {
        const { name, slug, description, image, parentId, sortOrder } = req.body;
        const category = await prisma.productCategory.create({
            data: { name, slug, description, image, parentId, sortOrder }
        });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product category
router.put('/categories/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, image, parentId, sortOrder } = req.body;
        const category = await prisma.productCategory.update({
            where: { id: parseInt(id) },
            data: { name, slug, description, image, parentId, sortOrder }
        });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product category
router.delete('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.productCategory.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const { status, category, featured, search, page = 1, limit = 10 } = req.query;
        const where = {};

        if (status) where.status = status;
        if (category) where.categoryId = parseInt(category);
        if (featured === 'true') where.isFeatured = true;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { shortDesc: { contains: search } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true, slug: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            success: true,
            data: products,
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

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id: parseInt(id) || 0 },
                    { slug: id }
                ]
            },
            include: { category: true }
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create product
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, slug, description, shortDesc, price, salePrice, sku, images, stock, status, categoryId, isFeatured, specs, seoTitle, seoDesc } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                slug,
                description,
                shortDesc,
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                sku,
                images,
                stock: parseInt(stock) || 0,
                status: status || 'DRAFT',
                categoryId: categoryId ? parseInt(categoryId) : null,
                isFeatured: isFeatured || false,
                specs,
                seoTitle,
                seoDesc
            },
            include: { category: true }
        });

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, shortDesc, price, salePrice, sku, images, stock, status, categoryId, isFeatured, specs, seoTitle, seoDesc } = req.body;

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name,
                slug,
                description,
                shortDesc,
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                sku,
                images,
                stock: parseInt(stock) || 0,
                status,
                categoryId: categoryId ? parseInt(categoryId) : null,
                isFeatured,
                specs,
                seoTitle,
                seoDesc
            },
            include: { category: true }
        });

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
