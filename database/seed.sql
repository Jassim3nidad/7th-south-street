-- ============================================================
-- 7TH SOUTH STREET — Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE `7th_south_street`;

-- ============================================================
-- DEFAULT ADMIN (password: Admin@7SS2024!)
-- ============================================================
INSERT INTO `admins` (`name`, `email`, `password_hash`, `role`) VALUES
('7SS Admin', 'admin@7thsouthstreet.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');
-- NOTE: Hash above is bcrypt of 'Admin@7SS2024!' — regenerate for production!

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO `categories` (`name`, `slug`, `description`, `sort_order`) VALUES
('Headwear', 'headwear', 'Snapbacks, fitted caps, and premium headwear', 1),
('Tops', 'tops', 'Tees, shirts, and upper body fits', 2),
('Hoodies & Sweats', 'hoodies-sweats', 'Premium fleece and pullover silhouettes', 3),
('Accessories', 'accessories', 'Bags, socks, and streetwear accessories', 4);

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO `products` (`category_id`, `name`, `slug`, `sku`, `description`, `price`, `compare_price`, `status`, `is_featured`, `has_sizes`) VALUES
(1, '7SS Arch Logo Snapback', '7ss-arch-logo-snapback', 'HW-SNAP-001',
 'Six-panel snapback with embroidered 7SS arch logo. Structured front, flat brim. One size adjustable.',
 895.00, NULL, 'available', 1, 1),

(1, 'South Street Fitted 59FIFTY', 'south-street-fitted-59fifty', 'HW-FIT-001',
 'Premium 59FIFTY fitted cap. Side script embroidery. High crown, flat brim. Limited run.',
 1200.00, NULL, 'available', 1, 1),

(1, 'Blackout Snapback', 'blackout-snapback', 'HW-SNAP-002',
 'All-black tonal colorway. Woven label at back. Minimal and clean.',
 750.00, NULL, 'available', 0, 1),

(2, '7SS Oversized Tee — Bone', '7ss-oversized-tee-bone', 'TP-TEE-001',
 'Heavyweight 250gsm cotton. Drop shoulder. Double-stitched hems. 7SS chest wordmark, back print.',
 650.00, NULL, 'available', 1, 1),

(2, 'South Street Graphic Tee', 'south-street-graphic-tee', 'TP-TEE-002',
 'Vintage washed black tee. Full front graphic print. Relaxed fit.',
 695.00, NULL, 'available', 0, 1),

(2, 'Nonchalant Luxury Tee', 'nonchalant-luxury-tee', 'TP-TEE-003',
 'Premium pima cotton. Subtle tonal chest embroidery. Clean and understated.',
 750.00, NULL, 'available', 1, 1),

(3, '7SS Premium Hoodie — Black', '7ss-premium-hoodie-black', 'HD-HOOD-001',
 '500gsm heavyweight fleece. Kangaroo pocket. Ribbed cuffs and hem. Embroidered logo chest left.',
 1895.00, NULL, 'available', 1, 1),

(3, 'South Street Crewneck', 'south-street-crewneck', 'HD-CREW-001',
 'Medium weight French terry. Dropped shoulders. Minimal arch logo at chest.',
 1495.00, NULL, 'available', 0, 1),

(4, '7SS Tote Bag', '7ss-tote-bag', 'AC-TOTE-001',
 'Heavyweight canvas tote. Screen printed 7SS wordmark. Reinforced handles.',
 450.00, NULL, 'available', 0, 0),

(4, 'Logo Crew Socks — 3 Pack', 'logo-crew-socks-3pack', 'AC-SOCK-001',
 'Mid-calf crew socks. Jacquard 7SS logo. Ribbed knit. One size fits most.',
 350.00, NULL, 'available', 0, 0);

-- ============================================================
-- PRODUCT IMAGES (placeholder — replace with real URLs)
-- ============================================================
INSERT INTO `product_images` (`product_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`) VALUES
(1, '/uploads/products/hw-snap-001-front.jpg', '7SS Arch Logo Snapback - Front', 0, 1),
(1, '/uploads/products/hw-snap-001-back.jpg', '7SS Arch Logo Snapback - Back', 1, 0),
(2, '/uploads/products/hw-fit-001-front.jpg', 'South Street Fitted - Front', 0, 1),
(2, '/uploads/products/hw-fit-001-side.jpg', 'South Street Fitted - Side', 1, 0),
(4, '/uploads/products/tp-tee-001-front.jpg', '7SS Oversized Tee - Front', 0, 1),
(4, '/uploads/products/tp-tee-001-back.jpg', '7SS Oversized Tee - Back', 1, 0),
(7, '/uploads/products/hd-hood-001-front.jpg', '7SS Premium Hoodie - Front', 0, 1),
(7, '/uploads/products/hd-hood-001-back.jpg', '7SS Premium Hoodie - Back', 1, 0);

-- ============================================================
-- INVENTORY
-- ============================================================
-- Snapback (OS only)
INSERT INTO `inventory` (`product_id`, `size`, `stock_quantity`) VALUES
(1, 'OS', 45),
(2, 'S', 10), (2, 'M', 10), (2, 'L', 8), (2, 'XL', 5), (2, 'XXL', 3),
(3, 'OS', 30),
-- Tees
(4, 'S', 12), (4, 'M', 20), (4, 'L', 18), (4, 'XL', 10), (4, 'XXL', 5),
(5, 'S', 8), (5, 'M', 15), (5, 'L', 12), (5, 'XL', 8), (5, 'XXL', 3),
(6, 'S', 10), (6, 'M', 18), (6, 'L', 16), (6, 'XL', 9), (6, 'XXL', 4),
-- Hoodies
(7, 'S', 6), (7, 'M', 12), (7, 'L', 10), (7, 'XL', 7), (7, 'XXL', 3),
(8, 'S', 8), (8, 'M', 14), (8, 'L', 11), (8, 'XL', 6), (8, 'XXL', 2),
-- Accessories (no size)
(9, 'OS', 25),
(10, 'OS', 40);

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO `events` (`title`, `slug`, `description`, `event_date`, `end_date`, `location_name`, `location_address`, `poster_url`, `max_rsvp`, `status`, `is_featured`) VALUES
('7SS Pop-Up Vol. 1', '7ss-popup-vol-1',
 'Our first official pop-up. New drops, limited pieces, exclusive in-store only items. Come through.',
 '2024-12-14 12:00:00', '2024-12-14 20:00:00',
 'The Collective BGC', 'Bonifacio Global City, Taguig, Metro Manila',
 '/uploads/events/popup-vol1-poster.jpg', 100, 'upcoming', 1),

('7SS Holiday Drop', '7ss-holiday-drop',
 'Season exclusive pieces. Limited run holiday colorways. One day only.',
 '2024-12-21 14:00:00', '2024-12-21 22:00:00',
 'Cubao Expo', 'Araneta City, Cubao, Quezon City',
 '/uploads/events/holiday-drop-poster.jpg', 80, 'upcoming', 0);

-- ============================================================
-- NEWSLETTER SUBSCRIBERS (samples)
-- ============================================================
INSERT INTO `newsletter_subscribers` (`email`, `name`) VALUES
('sample1@email.com', 'Sample One'),
('sample2@email.com', 'Sample Two');
