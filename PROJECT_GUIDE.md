# CMS Node.js - Project Guide

## 📋 Tổng quan dự án

CMS platform được xây dựng với:
- **API**: Express + Prisma + MySQL (port 3001)
- **Admin Panel**: React + Ant Design + Vite (port 3002)
- **Frontend**: Express + Nunjucks templating (port 3000)

### Đăng nhập Admin
- Email: `admin@example.com`
- Password: `admin123`

---

## 📁 Cấu trúc dự án

```
wordpress_node/
├── packages/
│   ├── api/                    # Backend API
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── src/
│   │       ├── routes/         # API endpoints
│   │       │   ├── auth.js
│   │       │   ├── pages.js
│   │       │   ├── posts.js    # Blog posts CRUD
│   │       │   ├── products.js # E-commerce products
│   │       │   ├── themes.js   # Theme management
│   │       │   └── media.js
│   │       ├── services/
│   │       │   ├── themeService.js  # Import demo data
│   │       │   └── imageService.js
│   │       └── index.js
│   │
│   ├── admin/                  # React Admin Panel
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Posts.jsx         
│   │       │   ├── PostEditor.jsx    
│   │       │   ├── PostCategories.jsx
│   │       │   ├── Products.jsx      
│   │       │   ├── ProductEditor.jsx 
│   │       │   ├── ProductCategories.jsx
│   │       │   ├── Pages.jsx
│   │       │   ├── PageEditor.jsx
│   │       │   ├── Themes.jsx
│   │       │   ├── ThemeDetail.jsx   # ✅ Enhanced with tabs
│   │       │   └── Media.jsx
│   │       ├── layouts/
│   │       │   └── AdminLayout.jsx   # Sidebar navigation
│   │       ├── services/api.js       # API client
│   │       └── App.jsx               # Routes
│   │
│   ├── web/                    # Frontend website
│   │   └── src/
│   │       └── index.js        # ✅ Comprehensive routes (blog, products)
│   │
│   └── shared/                 # Shared utilities
│
├── themes/                     # Theme files
│   ├── developer-default/
│   ├── blog-pro/
│   ├── business/
│   ├── portfolio/
│   ├── news-magazine/
│   └── ecommerce/              # ✅ Premium theme with full templates
│
└── uploads/                    # Uploaded media files
```

---

## 🎨 Cách thêm Theme mới

### Bước 1: Tạo thư mục theme
```
themes/
└── my-theme/
    ├── theme.json              # Metadata (BẮT BUỘC)
    ├── templates/
    │   ├── layouts/
    │   │   └── default.njk     # Base layout
    │   ├── home.njk            # Homepage template
    │   ├── page.njk            # Generic page
    │   ├── blog.njk            # Blog listing
    │   ├── single.njk          # Blog post detail
    │   ├── products.njk        # Products listing
    │   ├── product.njk         # Product detail
    │   ├── archive.njk         # Category archive
    │   └── 404.njk
    ├── assets/
    │   ├── css/theme.css
    │   └── js/theme.js
    └── demo/
        └── data.json           # Demo content (optional)
```

### Bước 2: Tạo theme.json
```json
{
    "name": "My Theme",
    "slug": "my-theme",
    "version": "1.0.0",
    "description": "Theme description",
    "author": "Your Name",
    "thumbnail": "demo/images/thumbnail.jpg",
    "features": {
        "darkMode": true,
        "newsletter": false,
        "productShowcase": true,
        "blogIntegration": true
    },
    "templates": ["home", "page", "blog", "single", "products", "product", "404"],
    "settings": {
        "primaryColor": "#0071e3",
        "accentColor": "#ff6b35",
        "fontFamily": "Inter, sans-serif"
    }
}
```

### Bước 3: Tạo demo/data.json (optional)
```json
{
    "images": [
        { "placeholder": "{{hero}}", "url": "https://unsplash.com/...", "filename": "hero.jpg" }
    ],
    "pages": [
        { "title": "Home", "slug": "home", "template": "home", "isHomepage": true, "content": {...} }
    ],
    "postCategories": [
        { "name": "News", "slug": "news" }
    ],
    "posts": [
        { "title": "...", "categorySlug": "news", "content": {...} }
    ],
    "productCategories": [...],
    "products": [...],
    "menus": [...],
    "settings": { "site_name": "..." }
}
```

### Bước 4: Đăng ký theme
- Vào Admin → Themes → Click "Refresh" hoặc gọi API:
```bash
curl -X POST http://localhost:3001/api/themes/refresh -H "Authorization: Bearer TOKEN"
```

---

## ✅ Đã hoàn thành

| Feature | Status |
|---------|--------|
| User authentication (JWT) | ✅ |
| Page management (CRUD, block editor) | ✅ |
| Theme system (6 themes) | ✅ |
| Media library | ✅ |
| Menu management | ✅ |
| Site settings | ✅ |
| Post/News management | ✅ |
| Post categories (hierarchical) | ✅ |
| Product management | ✅ |
| Product categories (hierarchical) | ✅ |
| Demo data import (posts/products) | ✅ |
| Content crawler (external URLs) | ✅ |
| **Frontend blog routes** | ✅ NEW |
| **Frontend product routes** | ✅ NEW |
| **Category pages** | ✅ NEW |
| **Ecommerce theme with 20+ products** | ✅ NEW |
| **Ecommerce theme with 20 blog posts** | ✅ NEW |
| **ThemeDetail with pages list** | ✅ NEW |
| **Pagination support** | ✅ NEW |

---

## ⚠️ Chưa hoàn thiện / Cần cải thiện

### 1. ~~Frontend Integration~~ ✅ HOÀN THÀNH
- [x] Posts listing page template (archive)
- [x] Single post template với dynamic data từ API
- [x] Product listing và product detail pages
- [x] Category archive pages
- [x] Pagination cho posts/products
- [ ] Search functionality (chưa làm)

### 2. Admin Panel
- [ ] Block editor cho Posts và Products (hiện dùng JSON)
- [ ] Drag-drop image upload cho Products
- [ ] Tags management UI (hiện chỉ là input)
- [ ] Preview trước khi publish
- [ ] Bulk actions (delete nhiều items)

### 3. API
- [ ] API pagination optimization
- [ ] Full-text search
- [ ] Image optimization/resizing
- [ ] Caching layer (Redis)

### 4. Theme System
- [ ] Live preview khi switch theme
- [x] Theme settings UI (colors, fonts) ✅
- [x] Theme pages list in admin ✅
- [ ] Child theme support

---

## 🚀 Có thể mở rộng

### E-commerce Features
- [ ] Shopping cart
- [ ] Checkout process
- [ ] Payment integration (Stripe, PayPal)
- [ ] Order management
- [ ] Inventory tracking
- [ ] Product variants (size, color)
- [ ] Discount codes / Coupons

### Content Features
- [ ] Comments system
- [ ] Newsletter subscription
- [ ] Social sharing
- [x] Related posts/products ✅
- [ ] Custom fields / Meta boxes
- [ ] Revisions / Version history
- [ ] Scheduled publishing

### User Features
- [ ] User roles & permissions
- [ ] Multiple authors
- [ ] User profiles
- [ ] Author archives

### SEO & Analytics
- [ ] Sitemap generation
- [ ] Meta tags optimization
- [ ] OpenGraph / Twitter cards
- [ ] Google Analytics integration
- [ ] Schema.org markup

### Performance
- [ ] Static site generation (SSG)
- [ ] CDN integration
- [ ] Image lazy loading
- [ ] Critical CSS extraction

### Developer Experience
- [ ] REST API documentation (Swagger)
- [ ] GraphQL API
- [ ] Webhooks
- [ ] Plugin/Extension system

---

## 🔧 Commands

```bash
# Install dependencies
pnpm install

# Run all servers (dev mode)
pnpm dev

# Run individual servers
cd packages/api && pnpm dev     # API: 3001
cd packages/admin && pnpm dev   # Admin: 3002
cd packages/web && pnpm dev     # Web: 3000

# Database
cd packages/api
npx prisma db push              # Sync schema
npx prisma generate             # Generate client
npx prisma studio               # GUI database admin

# Seed data
node prisma/seed.js
```

---

## 📊 Database Models

```
User (admin users)
Theme (installed themes)
Page (static pages)
Post (blog posts/news)
PostCategory (post categories)
Product (e-commerce products)
ProductCategory (product categories)
Media (uploaded files)
Menu (navigation menus)
Setting (site settings)
CrawledContent (external content)
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/pages | List pages |
| GET | /api/posts | List posts |
| GET | /api/posts/slug/:slug | Get post by slug |
| GET | /api/posts/categories | Post categories |
| GET | /api/products | List products |
| GET | /api/products/slug/:slug | Get product by slug |
| GET | /api/products/categories | Product categories |
| GET | /api/themes | List themes |
| GET | /api/themes/:slug/pages | Pages using theme |
| POST | /api/themes/{id}/import-demo | Import demo data |
| GET | /api/media | Media library |

---

## 🎨 Ecommerce Theme Features

Theme **Modern E-commerce** bao gồm:

### Templates
- `home.njk` - Hero section, featured products, categories, blog, trust badges
- `products.njk` - Product listing with sidebar filters
- `product.njk` - Product detail with gallery, tabs, reviews
- `blog.njk` - Blog listing với featured posts
- `single.njk` - Blog post detail với related posts
- `archive.njk` - Category archive

### Demo Data
- **22 Products** across 4 categories (Electronics, Accessories, Fashion, Home)
- **20 Blog Posts** across 5 categories
- **5 Pages** (Home, About, Contact, FAQ, Shipping)
- Complete menus and settings

### Design Features
- Premium Apple/Shopify-inspired design
- Responsive layout (mobile, tablet, desktop)
- Modern CSS with animations
- 1200+ lines of custom CSS

---

*Cập nhật: 2025-12-13*
