# 7TH SOUTH STREET — Full-Stack E-Commerce Platform

> Premium underground streetwear brand. Minimalist. Dark. Unapologetic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, Framer Motion |
| Backend | PHP 8.2 REST API |
| Database | MySQL 8.0 |
| Deployment | Vercel (frontend) + VPS/shared hosting (backend) |
| CI/CD | GitHub → Vercel auto-deploy |
| Local Dev | Laragon or Docker |

---

## Project Structure

```
7th-south-street/
├── frontend/               # Next.js app (deploy to Vercel)
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # Reusable React components
│   │   ├── lib/            # API clients, utilities
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand global state
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── backend/                # PHP REST API
│   ├── api/                # Route handlers
│   ├── config/             # DB config, constants
│   ├── middleware/          # Auth, CORS, rate limiting
│   ├── models/             # Database models
│   ├── helpers/            # Utility functions
│   └── uploads/            # Product image storage
├── database/
│   ├── schema.sql          # Full DB schema
│   └── seed.sql            # Sample data
└── docs/                   # Deployment guides
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.2+
- MySQL 8.0+
- Laragon (Windows) OR Docker

---

### 1. Database Setup

**Using Laragon:**
1. Start Laragon → Start All
2. Open HeidiSQL (bundled)
3. Create database: `7th_south_street`
4. Run `database/schema.sql`
5. Run `database/seed.sql`

**Using Docker:**
```bash
docker run --name 7ss-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=7th_south_street \
  -p 3306:3306 -d mysql:8.0

mysql -h 127.0.0.1 -u root -proot 7th_south_street < database/schema.sql
mysql -h 127.0.0.1 -u root -proot 7th_south_street < database/seed.sql
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials
```

**With Laragon:** Place `backend/` folder inside `C:/laragon/www/7ss-api/`
Access at: `http://7ss-api.test`

**With PHP built-in server (dev):**
```bash
cd backend
php -S localhost:8000
```

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```

Open `http://localhost:3000`

---

## Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.com
   ```
5. Deploy → Every GitHub push auto-deploys ✓

### Backend → Shared Hosting / VPS

**Shared Hosting (cPanel):**
1. Upload `backend/` to `public_html/api/`
2. Create MySQL database via cPanel
3. Import `database/schema.sql`
4. Update `backend/config/database.php` with credentials
5. Set `CORS_ORIGIN` to your Vercel URL

**VPS (Ubuntu + Nginx):**
```bash
# Install stack
sudo apt install nginx php8.2-fpm php8.2-mysql mysql-server

# Upload backend files to /var/www/7ss-api/
# Configure Nginx (see docs/nginx.conf)
sudo systemctl restart nginx php8.2-fpm
```

---

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_INSTAGRAM_TOKEN=your_instagram_token
```

### Backend (`.env`)
```env
DB_HOST=localhost
DB_NAME=7th_south_street
DB_USER=root
DB_PASS=
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:3000
UPLOAD_MAX_SIZE=5242880
```

---

## Admin Access

Default admin credentials (change after first login!):
- URL: `/admin`
- Email: `admin@7thsouthstreet.com`
- Password: `Admin@7SS2024!`

---

## API Documentation

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/logout` | Logout |
| GET | `/products` | List all products |
| GET | `/products/{id}` | Single product |
| POST | `/products` | Create product (admin) |
| PUT | `/products/{id}` | Update product (admin) |
| DELETE | `/products/{id}` | Delete product (admin) |
| GET | `/categories` | List categories |
| GET | `/events` | List events |
| POST | `/events` | Create event (admin) |
| GET | `/orders` | List orders (admin) |
| POST | `/orders` | Create order |
| GET | `/customers` | List customers (admin) |
| POST | `/newsletter/subscribe` | Subscribe to newsletter |
| GET | `/dashboard/stats` | Dashboard analytics (admin) |

---

## License

Private — 7Th South Street © 2024. All rights reserved.
