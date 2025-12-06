import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import themeRoutes from './routes/themes.js';
import pageRoutes from './routes/pages.js';
import postRoutes from './routes/posts.js';
import productRoutes from './routes/products.js';
import crawlerRoutes from './routes/crawler.js';
import mediaRoutes from './routes/media.js';
import settingRoutes from './routes/settings.js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '../../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3002',
        process.env.ADMIN_URL,
        process.env.WEB_URL
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/products', productRoutes);
app.use('/api/crawler', crawlerRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
