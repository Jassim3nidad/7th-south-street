-- ============================================================
-- 7TH SOUTH STREET — MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS `7th_south_street`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `7th_south_street`;

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','admin') DEFAULT 'admin',
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- CUSTOMERS (registered buyers)
-- ============================================================
CREATE TABLE `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30),
  `password_hash` VARCHAR(255),
  `email_verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================
CREATE TABLE `customer_addresses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED NOT NULL,
  `label` VARCHAR(50) DEFAULT 'Home',
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255),
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(80) DEFAULT 'Philippines',
  `is_default` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `description` TEXT,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(280) NOT NULL UNIQUE,
  `sku` VARCHAR(80) NOT NULL UNIQUE,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `compare_price` DECIMAL(10,2) COMMENT 'Original price for sale display',
  `status` ENUM('available','sold_out','archived','coming_soon') DEFAULT 'available',
  `is_featured` TINYINT(1) DEFAULT 0,
  `has_sizes` TINYINT(1) DEFAULT 1,
  `weight_grams` INT,
  `meta_title` VARCHAR(255),
  `meta_description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_featured` (`is_featured`)
) ENGINE=InnoDB;

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE `product_images` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `alt_text` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  `is_primary` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_product` (`product_id`)
) ENGINE=InnoDB;

-- ============================================================
-- INVENTORY (size/variant-level stock)
-- ============================================================
CREATE TABLE `inventory` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `size` VARCHAR(20) COMMENT 'XS,S,M,L,XL,XXL,OS,Snapback,Fitted, etc.',
  `color` VARCHAR(50),
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT DEFAULT 5,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_product_variant` (`product_id`, `size`, `color`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(20) NOT NULL UNIQUE,
  `customer_id` INT UNSIGNED,
  `guest_email` VARCHAR(191) COMMENT 'For guest checkout',
  `status` ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `payment_status` ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
  `payment_reference` VARCHAR(255),
  -- Shipping info snapshot
  `shipping_name` VARCHAR(180),
  `shipping_email` VARCHAR(191),
  `shipping_phone` VARCHAR(30),
  `shipping_address` TEXT,
  `shipping_city` VARCHAR(100),
  `shipping_province` VARCHAR(100),
  `shipping_postal` VARCHAR(20),
  `shipping_country` VARCHAR(80) DEFAULT 'Philippines',
  -- Amounts
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `shipping_fee` DECIMAL(10,2) DEFAULT 0,
  `discount_amount` DECIMAL(10,2) DEFAULT 0,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `notes` TEXT,
  `shipped_at` TIMESTAMP NULL,
  `delivered_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED,
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot at time of order',
  `sku` VARCHAR(80),
  `size` VARCHAR(20),
  `color` VARCHAR(50),
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- EVENTS (Pop-up)
-- ============================================================
CREATE TABLE `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(280) NOT NULL UNIQUE,
  `description` TEXT,
  `event_date` DATETIME NOT NULL,
  `end_date` DATETIME,
  `location_name` VARCHAR(255),
  `location_address` TEXT,
  `location_lat` DECIMAL(10,7),
  `location_lng` DECIMAL(10,7),
  `poster_url` VARCHAR(500),
  `max_rsvp` INT DEFAULT 0 COMMENT '0 = unlimited',
  `rsvp_count` INT DEFAULT 0,
  `status` ENUM('upcoming','ongoing','past','cancelled') DEFAULT 'upcoming',
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_event_date` (`event_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB;

-- ============================================================
-- EVENT RSVPs
-- ============================================================
CREATE TABLE `event_rsvps` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_event_email` (`event_id`, `email`)
) ENGINE=InnoDB;

-- ============================================================
-- EVENT GALLERY
-- ============================================================
CREATE TABLE `event_gallery` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255),
  `sort_order` INT DEFAULT 0,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE `newsletter_subscribers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(180),
  `is_active` TINYINT(1) DEFAULT 1,
  `subscribed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` TIMESTAMP NULL
) ENGINE=InnoDB;

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE `wishlists` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_wishlist` (`customer_id`, `product_id`)
) ENGINE=InnoDB;

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE `admin_audit_log` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50),
  `entity_id` INT UNSIGNED,
  `details` JSON,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;
