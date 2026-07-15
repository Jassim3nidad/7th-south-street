-- ============================================
-- 7TH SOUTH STREET - DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS `7thsouthstreet` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `7thsouthstreet`;

-- ============================================
-- ADMINS
-- ============================================
CREATE TABLE `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin','admin') DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- CUSTOMERS / USERS
-- ============================================
CREATE TABLE `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255),
  `phone` VARCHAR(30),
  `address_line1` VARCHAR(200),
  `address_line2` VARCHAR(200),
  `city` VARCHAR(100),
  `province` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(60) DEFAULT 'Philippines',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(80) NOT NULL UNIQUE,
  `description` TEXT,
  `sort_order` TINYINT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED,
  `sku` VARCHAR(60) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `compare_price` DECIMAL(10,2) DEFAULT NULL COMMENT 'Original price for sale items',
  `status` ENUM('available','sold_out','draft','archived') DEFAULT 'available',
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE `product_images` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `alt_text` VARCHAR(200),
  `sort_order` TINYINT UNSIGNED DEFAULT 0,
  `is_primary` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- INVENTORY (per product + size)
-- ============================================
CREATE TABLE `inventory` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `size` VARCHAR(20) NOT NULL COMMENT 'XS, S, M, L, XL, XXL, OS (one size), etc.',
  `quantity` SMALLINT UNSIGNED DEFAULT 0,
  `low_stock_threshold` SMALLINT UNSIGNED DEFAULT 5,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `product_size` (`product_id`, `size`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED,
  `order_number` VARCHAR(30) NOT NULL UNIQUE,
  `status` ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shipping_fee` DECIMAL(10,2) DEFAULT 0.00,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(60),
  `payment_status` ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  `shipping_address` JSON,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED,
  `product_name` VARCHAR(200) NOT NULL COMMENT 'Snapshot at time of order',
  `product_sku` VARCHAR(60) NOT NULL,
  `size` VARCHAR(20),
  `quantity` SMALLINT UNSIGNED NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- EVENTS (Pop-up shops)
-- ============================================
CREATE TABLE `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `description` TEXT,
  `location_name` VARCHAR(200),
  `location_address` TEXT,
  `location_lat` DECIMAL(10,8),
  `location_lng` DECIMAL(11,8),
  `event_date` DATETIME NOT NULL,
  `end_date` DATETIME,
  `poster_url` VARCHAR(500),
  `status` ENUM('upcoming','ongoing','past','cancelled') DEFAULT 'upcoming',
  `rsvp_limit` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- EVENT RSVPs
-- ============================================
CREATE TABLE `event_rsvps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- EVENT GALLERY
-- ============================================
CREATE TABLE `event_gallery` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(300),
  `sort_order` TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================
CREATE TABLE `newsletter_subscribers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `subscribed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- ============================================
-- WISHLISTS
-- ============================================
CREATE TABLE `wishlists` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `customer_product` (`customer_id`, `product_id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Administrators are intentionally not seeded. Create a unique account out of band.

INSERT INTO `categories` (`name`, `slug`, `sort_order`) VALUES
('Snapbacks', 'snapbacks', 1),
('Fitted Caps', 'fitted-caps', 2),
('Shirts', 'shirts', 3),
('Hoodies', 'hoodies', 4),
('Accessories', 'accessories', 5);

INSERT INTO `products` (`category_id`, `sku`, `name`, `slug`, `description`, `price`, `status`, `is_featured`) VALUES
(3, '7SS-SHT-001', 'Southside Heavyweight Tee', 'southside-heavyweight-tee', 'Premium 300gsm heavyweight cotton. Washed for a lived-in feel. Drop shoulder silhouette. Screen-printed 7SS front logo with embroidered back tag.', 1299.00, 'available', 1),
(4, '7SS-HDY-001', 'Vault Oversized Hoodie', 'vault-oversized-hoodie', 'Ultra-heavy 420gsm fleece. Relaxed oversized fit. Kangaroo pocket. Embroidered chest logo. Garment-washed for premium drape.', 2499.00, 'available', 1),
(1, '7SS-SNP-001', 'Block Letter Snapback', 'block-letter-snapback', '6-panel structured crown. Flat brim. Embroidered block 7SS logo. Snap closure for adjustable fit.', 899.00, 'available', 1),
(2, '7SS-FTD-001', 'South Street Fitted 59Fifty', 'south-street-fitted-59fifty', 'On-field style fitted cap. High-crown structured build. Full embroidery. Made for the culture.', 1199.00, 'available', 0),
(3, '7SS-SHT-002', 'Underground Script Tee', 'underground-script-tee', 'Script "7th South" across chest. 240gsm cotton. Pre-washed. Regular fit with ribbed collar.', 999.00, 'available', 0),
(5, '7SS-ACC-001', 'Street Culture Tote', 'street-culture-tote', 'Heavy canvas 400gsm tote. 7SS graphic print. Reinforced handles. Internal zip pocket.', 599.00, 'available', 0);

INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `sort_order`) VALUES
(1, '/images/products/southside-tee-01.jpg', 1, 0),
(1, '/images/products/southside-tee-02.jpg', 0, 1),
(2, '/images/products/vault-hoodie-01.jpg', 1, 0),
(2, '/images/products/vault-hoodie-02.jpg', 0, 1),
(3, '/images/products/block-snapback-01.jpg', 1, 0),
(4, '/images/products/south-fitted-01.jpg', 1, 0),
(5, '/images/products/underground-tee-01.jpg', 1, 0),
(6, '/images/products/tote-01.jpg', 1, 0);

INSERT INTO `inventory` (`product_id`, `size`, `quantity`) VALUES
(1, 'S', 15), (1, 'M', 20), (1, 'L', 18), (1, 'XL', 12), (1, 'XXL', 8),
(2, 'S', 10), (2, 'M', 15), (2, 'L', 14), (2, 'XL', 9), (2, 'XXL', 5),
(3, 'OS', 30),
(4, '7 1/8', 5), (4, '7 1/4', 8), (4, '7 3/8', 10), (4, '7 1/2', 7), (4, '7 5/8', 4),
(5, 'S', 20), (5, 'M', 25), (5, 'L', 18), (5, 'XL', 10),
(6, 'OS', 40);

INSERT INTO `events` (`title`, `slug`, `description`, `location_name`, `location_address`, `event_date`, `status`) VALUES
('7SS Pop-Up: BGC Edition', 'popup-bgc-2025', 'Our first major pop-up in Bonifacio Global City. Limited drops, exclusive colorways, and the full 7SS experience.', 'The Yard BGC', '26th St, Taguig, Metro Manila', '2025-08-15 14:00:00', 'upcoming'),
('7SS x Culture Night Market', 'culture-night-market-2025', 'Collaborative night market with local artists and underground brands. Live music, food, and exclusive 7SS merchandise.', 'Eastwood Libis', 'Libis, Quezon City, Metro Manila', '2025-09-20 16:00:00', 'upcoming');
