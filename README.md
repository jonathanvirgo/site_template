# WordPress-like CMS with Node.js

Hệ thống CMS hiện đại với khả năng chuyển đổi theme, quản lý trang, và crawl nội dung.

## Tech Stack

- **Backend**: Node.js + Express + Prisma + MySQL
- **Admin Panel**: React + Ant Design
- **Public Frontend**: Express + Nunjucks (Theme rendering)
- **Package Manager**: pnpm (Monorepo với workspaces)

## Quick Start

### 1. Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for MySQL) or MySQL server

### 2. Start Database

```bash
# Using Docker
docker-compose up -d

# Or connect to existing MySQL and update .env
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with admin user and themes
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start all servers
pnpm dev

# Or start individually
pnpm dev:api    # API server at http://localhost:3001
pnpm dev:admin  # Admin panel at http://localhost:3002
pnpm dev:web    # Public website at http://localhost:3000
```

## Default Login

- **Email**: admin@example.com
- **Password**: admin123

## Project Structure

```
wordpress_node/
├── packages/
│   ├── api/          # Backend API (Express + Prisma)
│   ├── admin/        # Admin Panel (React + Ant Design)
│   ├── web/          # Public Frontend (Nunjucks)
│   └── shared/       # Shared utilities
├── themes/           # Theme packages
│   └── developer-default/
├── uploads/          # Uploaded files
└── docker-compose.yml
```

## Features

### ✅ Theme System
- Multiple themes support
- Theme switching from admin
- Demo data import (auto-download images)
- Theme settings customization

### ✅ Page Management
- Create/edit pages with JSON content blocks
- Multiple templates per theme
- SEO fields (title, description, keywords)
- Publish/draft workflow

### ✅ Content Crawler
- Crawl any URL
- Extract title, content, images
- Auto-download images locally
- Import as draft page

### ✅ Media Library
- Upload images
- Drag & drop upload
- Image preview
- Copy URL to clipboard

## Theme Development

Create a new theme in `/themes/your-theme/`:

```
your-theme/
├── theme.json        # Theme metadata
├── templates/
│   ├── layouts/
│   │   └── default.njk
│   ├── home.njk
│   ├── page.njk
│   └── 404.njk
├── assets/
│   ├── css/
│   └── js/
└── demo/
    ├── data.json     # Demo content
    └── images/       # Demo images
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/themes` | List all themes |
| `POST /api/themes/:slug/activate` | Activate theme |
| `POST /api/themes/:slug/import-demo` | Import demo data |
| `GET /api/pages` | List pages |
| `POST /api/pages` | Create page |
| `POST /api/crawler/crawl` | Start crawl job |

## License

MIT
