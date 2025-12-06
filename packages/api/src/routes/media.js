import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

const router = Router();

// Get all media files
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { filename: { contains: search } },
                { originalName: { contains: search } },
                { alt: { contains: search } },
            ];
        }

        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.media.count({ where })
        ]);

        res.json({
            success: true,
            data: media,
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

// Upload single file
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { alt } = req.body;
        const originalName = req.file.originalname;
        const ext = path.extname(originalName).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        const outputPath = path.join(UPLOADS_DIR, filename);

        let width, height;

        // Process image with sharp
        if (req.file.mimetype !== 'image/svg+xml') {
            const image = sharp(req.file.buffer);
            const metadata = await image.metadata();
            width = metadata.width;
            height = metadata.height;

            // Optimize and save
            await image
                .resize(1920, 1920, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toFile(outputPath);
        } else {
            // Save SVG as-is
            fs.writeFileSync(outputPath, req.file.buffer);
        }

        // Save to database
        const media = await prisma.media.create({
            data: {
                filename,
                originalName,
                path: outputPath,
                url: `/uploads/${filename}`,
                mimetype: req.file.mimetype,
                size: req.file.size,
                width,
                height,
                alt: alt || '',
            }
        });

        res.status(201).json({
            success: true,
            data: media
        });
    } catch (error) {
        next(error);
    }
});

// Upload multiple files
router.post('/upload-multiple', authenticate, upload.array('files', 10), async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const results = [];

        for (const file of req.files) {
            try {
                const originalName = file.originalname;
                const ext = path.extname(originalName).toLowerCase();
                const filename = `${uuidv4()}${ext}`;
                const outputPath = path.join(UPLOADS_DIR, filename);

                let width, height;

                if (file.mimetype !== 'image/svg+xml') {
                    const image = sharp(file.buffer);
                    const metadata = await image.metadata();
                    width = metadata.width;
                    height = metadata.height;

                    await image
                        .resize(1920, 1920, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .jpeg({ quality: 85 })
                        .toFile(outputPath);
                } else {
                    fs.writeFileSync(outputPath, file.buffer);
                }

                const media = await prisma.media.create({
                    data: {
                        filename,
                        originalName,
                        path: outputPath,
                        url: `/uploads/${filename}`,
                        mimetype: file.mimetype,
                        size: file.size,
                        width,
                        height,
                        alt: '',
                    }
                });

                results.push({ success: true, data: media });
            } catch (error) {
                results.push({ success: false, error: error.message, file: file.originalname });
            }
        }

        res.status(201).json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
});

// Update media
router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { alt } = req.body;

        const media = await prisma.media.update({
            where: { id: parseInt(id) },
            data: { alt }
        });

        res.json({
            success: true,
            data: media
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }
        next(error);
    }
});

// Delete media
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const media = await prisma.media.findUnique({
            where: { id: parseInt(id) }
        });

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // Delete file from filesystem
        if (fs.existsSync(media.path)) {
            fs.unlinkSync(media.path);
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
