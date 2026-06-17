# 7TH SOUTH STREET — Deployment Guide

---

## Frontend → Vercel (Recommended)

### Step 1: Push to GitHub
```bash
cd 7th-south-street
git init
git add .
git commit -m "Initial commit: 7SS full-stack e-commerce"
git remote add origin https://github.com/YOUR_USERNAME/7th-south-street.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com → **New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://api.yourdomain.com
   NEXT_PUBLIC_SITE_URL = https://yourdomain.vercel.app
   ```
5. Click **Deploy**

> Every push to `main` will auto-deploy via GitHub → Vercel CI/CD.

### Step 3: Custom Domain (optional)
- In Vercel dashboard → Domains → Add `shop.7thsouthstreet.com`

---

## Backend → Shared Hosting (cPanel)

### Step 1: Upload files
- Compress `backend/` folder
- Upload via **cPanel File Manager** to `public_html/api/`
- Extract

### Step 2: MySQL Database
1. cPanel → MySQL Databases
2. Create DB: `username_7ss`
3. Create DB user + assign all privileges
4. Import via phpMyAdmin:
   - Select database → Import tab
   - Upload `database/schema.sql` → Execute
   - Upload `database/seed.sql` → Execute

### Step 3: Configure environment
Edit `backend/config/database.php` directly with your credentials:
```php
$host   = 'localhost';
$dbname = 'username_7ss';
$user   = 'username_dbuser';
$pass   = 'your_db_password';
```

Or create `backend/.env`:
```env
DB_HOST=localhost
DB_NAME=username_7ss
DB_USER=username_dbuser
DB_PASS=your_secure_password
JWT_SECRET=generate-a-long-random-string-here
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

### Step 4: Verify
Visit: `https://yourdomain.com/api/products`
Should return JSON with products list.

---

## Backend → VPS (Ubuntu + Nginx)

```bash
# Install stack
sudo apt update
sudo apt install -y nginx php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-fileinfo mysql-server

# Secure MySQL
sudo mysql_secure_installation

# Create DB
sudo mysql -u root -p
CREATE DATABASE 7th_south_street CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '7ss_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON 7th_south_street.* TO '7ss_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u 7ss_user -p 7th_south_street < /path/to/database/schema.sql
mysql -u 7ss_user -p 7th_south_street < /path/to/database/seed.sql

# Upload backend files
sudo mkdir -p /var/www/7ss-api
sudo cp -r backend/* /var/www/7ss-api/
sudo chown -R www-data:www-data /var/www/7ss-api
sudo chmod -R 755 /var/www/7ss-api
sudo chmod -R 775 /var/www/7ss-api/uploads

# Copy Nginx config
sudo cp docs/nginx.conf /etc/nginx/sites-available/7ss-api
sudo ln -s /etc/nginx/sites-available/7ss-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Laragon (Local Development)

### Step 1: Setup
1. Download Laragon from https://laragon.org
2. Install and start (Start All)
3. Place `backend/` in `C:/laragon/www/7ss-api/`
4. Laragon auto-creates: `http://7ss-api.test`

### Step 2: Database
1. Open HeidiSQL (bundled with Laragon)
2. Connect with root/empty password
3. Create database `7th_south_street`
4. Run `schema.sql` then `seed.sql`

### Step 3: Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://7ss-api.test
npm run dev
```
Open: http://localhost:3000

---

## Docker (Alternative Local Dev)

```bash
# docker-compose.yml is in project root
docker-compose up -d

# This starts:
# - MySQL on port 3306
# - PHP + backend on port 8000
# - Next.js frontend on port 3000
```

---

## Environment Variables Reference

### Frontend (.env.local)
| Variable | Example | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:8000 | Backend API base URL |
| NEXT_PUBLIC_SITE_URL | http://localhost:3000 | Frontend URL |

### Backend (.env)
| Variable | Example | Description |
|----------|---------|-------------|
| DB_HOST | localhost | MySQL host |
| DB_NAME | 7th_south_street | Database name |
| DB_USER | root | MySQL user |
| DB_PASS | (empty for Laragon) | MySQL password |
| JWT_SECRET | (long random string) | JWT signing secret |
| JWT_EXPIRY | 86400 | Token lifetime in seconds |
| CORS_ORIGIN | http://localhost:3000 | Allowed frontend origin |
| UPLOAD_MAX_SIZE | 5242880 | Max image upload size (5MB) |

---

## Post-Deployment Checklist

- [ ] Admin password changed from default
- [ ] JWT_SECRET set to unique random string
- [ ] CORS_ORIGIN set to your Vercel URL
- [ ] Database seeded with initial data
- [ ] Uploads folder writable (chmod 775)
- [ ] HTTPS configured (SSL certificate)
- [ ] Test product listing: GET /api/products
- [ ] Test admin login: POST /api/auth/login
- [ ] Test order creation end-to-end
- [ ] Mobile responsiveness verified
- [ ] Vercel auto-deploy triggered by push confirmed

---

## Generating a Secure JWT Secret

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PHP
php -r "echo bin2hex(random_bytes(64));"

# OpenSSL
openssl rand -hex 64
```
