# WordPress-like CMS with Node.js

Hệ thống CMS hiện đại với khả năng chuyển đổi theme, quản lý trang, blog, sản phẩm và crawl nội dung.

## 🚀 Tech Stack

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
├── themes/           # Theme packages (6 themes included)
│   ├── developer-default/
│   ├── blog-pro/
│   ├── business/
│   ├── portfolio/
│   ├── news-magazine/
│   └── ecommerce/    # Premium e-commerce theme
├── uploads/          # Uploaded files
└── docker-compose.yml
```

## ✨ Features

### ✅ Theme System
- 6 beautiful themes included
- Theme switching from admin
- Demo data import (auto-download images)
- Theme settings customization (colors, fonts)
- View pages using each theme

### ✅ Page Management
- Create/edit pages with JSON content blocks
- Multiple templates per theme
- SEO fields (title, description, keywords)
- Publish/draft workflow
- Hierarchical pages (parent/child)

### ✅ Blog/News System
- Full post management (CRUD)
- Hierarchical categories
- Featured posts
- Tags support
- Author profiles
- View counts

### ✅ E-commerce Products
- Product management
- Categories & subcategories
- Pricing (regular & sale price)
- SKU & inventory tracking
- Multiple product images
- Product specifications

### ✅ Frontend Routes
- `/` - Homepage
- `/blog` - Blog listing
- `/blog/:slug` - Single post
- `/blog/category/:slug` - Category archive
- `/products` - Products listing
- `/products/:slug` - Product detail
- `/products/category/:slug` - Product category
- `/:slug` - Static pages

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

## 🎨 Themes

| Theme | Type | Demo Data |
|-------|------|-----------|
| Developer Default | General | Pages, menus |
| Blog Pro | Blogging | 7 posts, categories |
| Business | Corporate | Pages, services |
| Portfolio | Creative | Projects, galleries |
| News Magazine | News | Articles, categories |
| **E-commerce** | Shopping | **22 products, 20 posts** |

The **E-commerce** theme features:
- Premium Apple/Shopify-inspired design
- Full products catalog with filters
- Blog integration
- Responsive layout
- 1200+ lines of custom CSS

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
│   ├── blog.njk      # Blog listing
│   ├── single.njk    # Post detail
│   ├── products.njk  # Products listing
│   ├── product.njk   # Product detail
│   └── 404.njk
├── assets/
│   ├── css/
│   └── js/
└── demo/
    ├── data.json     # Demo content
    └── images/       # Demo images
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/themes` | List all themes |
| GET | `/api/themes/:slug/pages` | Pages using theme |
| POST | `/api/themes/:slug/activate` | Activate theme |
| POST | `/api/themes/:slug/import-demo` | Import demo data |
| GET | `/api/pages` | List pages |
| GET | `/api/posts` | List posts |
| GET | `/api/posts/slug/:slug` | Get post by slug |
| GET | `/api/posts/categories` | Post categories |
| GET | `/api/products` | List products |
| GET | `/api/products/slug/:slug` | Get product by slug |
| GET | `/api/products/categories` | Product categories |
| POST | `/api/crawler/crawl` | Start crawl job |

## 📖 Documentation

See [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for detailed documentation including:
- How to create new themes
- Database models
- Admin panel features
- API reference
- Roadmap & future features

## License

MIT
