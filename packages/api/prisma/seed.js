import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Administrator',
            role: 'ADMIN',
        },
    });
    console.log('✅ Created admin user:', admin.email);

    // Scan themes directory and register themes
    const themesDir = path.join(__dirname, '../../../themes');

    if (fs.existsSync(themesDir)) {
        const themeFolders = fs.readdirSync(themesDir).filter(f => {
            const themePath = path.join(themesDir, f);
            return fs.statSync(themePath).isDirectory() &&
                fs.existsSync(path.join(themePath, 'theme.json'));
        });

        for (const folder of themeFolders) {
            const themeJsonPath = path.join(themesDir, folder, 'theme.json');
            const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf-8'));

            const theme = await prisma.theme.upsert({
                where: { slug: themeData.slug || folder },
                update: {
                    name: themeData.name,
                    description: themeData.description,
                    thumbnail: themeData.thumbnail,
                    version: themeData.version || '1.0.0',
                    features: themeData.features || {},
                    path: folder,
                },
                create: {
                    name: themeData.name,
                    slug: themeData.slug || folder,
                    description: themeData.description,
                    thumbnail: themeData.thumbnail,
                    version: themeData.version || '1.0.0',
                    features: themeData.features || {},
                    path: folder,
                    isActive: folder === 'developer-default', // Default theme is active
                },
            });
            console.log(`✅ Registered theme: ${theme.name}`);
        }
    }

    // Create default settings
    const defaultSettings = [
        { key: 'site_name', value: { value: 'My CMS Site' } },
        { key: 'site_description', value: { value: 'A modern CMS built with Node.js' } },
        { key: 'site_url', value: { value: 'http://localhost:3000' } },
        { key: 'admin_email', value: { value: 'admin@example.com' } },
        { key: 'posts_per_page', value: { value: 10 } },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log('✅ Created default settings');

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
