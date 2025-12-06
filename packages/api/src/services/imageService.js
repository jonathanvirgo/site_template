import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Download image from URL and save locally
 */
export async function downloadImage(url, filename = null) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000,
        });

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
        }

        const buffer = await response.buffer();

        // Generate filename if not provided
        if (!filename) {
            const ext = getExtensionFromUrl(url) || 'jpg';
            filename = `${uuidv4()}.${ext}`;
        }

        // Ensure unique filename
        const uniqueFilename = `${Date.now()}-${filename}`;
        const outputPath = path.join(UPLOADS_DIR, uniqueFilename);

        // Process image with sharp (optimize and get metadata)
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Optimize and save
        await image
            .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath);

        return outputPath;
    } catch (error) {
        console.error('Error downloading image:', error.message);
        throw error;
    }
}

/**
 * Download multiple images in parallel
 */
export async function downloadImages(images, onProgress = null) {
    const results = [];
    const total = images.length;
    let completed = 0;

    const downloadPromises = images.map(async (imageInfo, index) => {
        try {
            const localPath = await downloadImage(
                imageInfo.url,
                imageInfo.filename
            );

            completed++;
            if (onProgress) {
                onProgress({ completed, total, current: imageInfo.url });
            }

            return {
                success: true,
                original: imageInfo,
                localPath,
                url: `/uploads/${path.basename(localPath)}`
            };
        } catch (error) {
            completed++;
            if (onProgress) {
                onProgress({ completed, total, current: imageInfo.url, error: error.message });
            }

            return {
                success: false,
                original: imageInfo,
                error: error.message
            };
        }
    });

    const settled = await Promise.allSettled(downloadPromises);

    return settled.map(result =>
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
    );
}

/**
 * Copy image from theme demo folder to uploads
 */
export async function copyDemoImage(themePath, imagePath) {
    const sourcePath = path.join(__dirname, '../../../../themes', themePath, 'demo', 'images', imagePath);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Demo image not found: ${imagePath}`);
    }

    const uniqueFilename = `${Date.now()}-${path.basename(imagePath)}`;
    const destPath = path.join(UPLOADS_DIR, uniqueFilename);

    // Copy and optimize with sharp
    await sharp(sourcePath)
        .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(destPath);

    return destPath;
}

/**
 * Get file extension from URL
 */
function getExtensionFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const ext = path.extname(pathname).toLowerCase().replace('.', '');
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'jpg';
    } catch {
        return 'jpg';
    }
}

/**
 * Delete image file
 */
export async function deleteImage(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting image:', error.message);
        return false;
    }
}

export default {
    downloadImage,
    downloadImages,
    copyDemoImage,
    deleteImage,
};
