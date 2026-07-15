-- Development/catalog seed only. Auth users and administrator credentials are never seeded.

insert into public.categories (id, name, slug, description, sort_order, is_active) values
  (1, 'Headwear', 'headwear', 'Snapbacks, fitted caps, and premium headwear', 1, true),
  (2, 'Tops', 'tops', 'Tees, shirts, and upper body fits', 2, true),
  (3, 'Hoodies & Sweats', 'hoodies-sweats', 'Premium fleece and pullover silhouettes', 3, true),
  (4, 'Accessories', 'accessories', 'Bags, socks, and streetwear accessories', 4, true)
on conflict (id) do nothing;

insert into public.products (
  id, category_id, name, slug, description, status, is_featured, has_sizes
) values
  (1, 1, '7SS Arch Logo Snapback', '7ss-arch-logo-snapback', 'Six-panel snapback with embroidered 7SS arch logo. Structured front, flat brim. One size adjustable.', 'available', true, false),
  (2, 1, 'South Street Fitted 59FIFTY', 'south-street-fitted-59fifty', 'Premium fitted cap with side script embroidery, high crown, and flat brim.', 'available', true, true),
  (3, 1, 'Blackout Snapback', 'blackout-snapback', 'All-black tonal colorway with a woven label at the back.', 'available', false, false),
  (4, 2, '7SS Oversized Tee - Bone', '7ss-oversized-tee-bone', 'Heavyweight 250gsm cotton with drop shoulders and a back print.', 'available', true, true),
  (5, 2, 'South Street Graphic Tee', 'south-street-graphic-tee', 'Vintage washed black tee with a relaxed fit.', 'available', false, true),
  (6, 2, 'Nonchalant Luxury Tee', 'nonchalant-luxury-tee', 'Premium pima cotton with subtle tonal chest embroidery.', 'available', true, true),
  (7, 3, '7SS Premium Hoodie - Black', '7ss-premium-hoodie-black', '500gsm heavyweight fleece with embroidered chest logo.', 'available', true, true),
  (8, 3, 'South Street Crewneck', 'south-street-crewneck', 'Medium weight French terry with dropped shoulders.', 'available', false, true),
  (9, 4, '7SS Tote Bag', '7ss-tote-bag', 'Heavyweight canvas tote with a screen-printed wordmark.', 'available', false, false),
  (10, 4, 'Logo Crew Socks - 3 Pack', 'logo-crew-socks-3pack', 'Mid-calf crew socks with a jacquard 7SS logo.', 'available', false, false)
on conflict (id) do nothing;

insert into public.product_variants (
  id, product_id, sku, size, color, price, compare_at_price, stock_quantity, low_stock_threshold, is_active
) values
  (1, 1, 'HW-SNAP-001-OS', 'OS', '', 895.00, null, 45, 5, true),
  (2, 2, 'HW-FIT-001-S', 'S', '', 1200.00, null, 10, 5, true),
  (3, 2, 'HW-FIT-001-M', 'M', '', 1200.00, null, 10, 5, true),
  (4, 2, 'HW-FIT-001-L', 'L', '', 1200.00, null, 8, 5, true),
  (5, 2, 'HW-FIT-001-XL', 'XL', '', 1200.00, null, 5, 5, true),
  (6, 2, 'HW-FIT-001-XXL', 'XXL', '', 1200.00, null, 3, 5, true),
  (7, 3, 'HW-SNAP-002-OS', 'OS', '', 750.00, null, 30, 5, true),
  (8, 4, 'TP-TEE-001-S', 'S', '', 650.00, null, 12, 5, true),
  (9, 4, 'TP-TEE-001-M', 'M', '', 650.00, null, 20, 5, true),
  (10, 4, 'TP-TEE-001-L', 'L', '', 650.00, null, 18, 5, true),
  (11, 4, 'TP-TEE-001-XL', 'XL', '', 650.00, null, 10, 5, true),
  (12, 4, 'TP-TEE-001-XXL', 'XXL', '', 650.00, null, 5, 5, true),
  (13, 5, 'TP-TEE-002-S', 'S', '', 695.00, null, 8, 5, true),
  (14, 5, 'TP-TEE-002-M', 'M', '', 695.00, null, 15, 5, true),
  (15, 5, 'TP-TEE-002-L', 'L', '', 695.00, null, 12, 5, true),
  (16, 5, 'TP-TEE-002-XL', 'XL', '', 695.00, null, 8, 5, true),
  (17, 5, 'TP-TEE-002-XXL', 'XXL', '', 695.00, null, 3, 5, true),
  (18, 6, 'TP-TEE-003-S', 'S', '', 750.00, null, 10, 5, true),
  (19, 6, 'TP-TEE-003-M', 'M', '', 750.00, null, 18, 5, true),
  (20, 6, 'TP-TEE-003-L', 'L', '', 750.00, null, 16, 5, true),
  (21, 6, 'TP-TEE-003-XL', 'XL', '', 750.00, null, 9, 5, true),
  (22, 6, 'TP-TEE-003-XXL', 'XXL', '', 750.00, null, 4, 5, true),
  (23, 7, 'HD-HOOD-001-S', 'S', '', 1895.00, null, 6, 5, true),
  (24, 7, 'HD-HOOD-001-M', 'M', '', 1895.00, null, 12, 5, true),
  (25, 7, 'HD-HOOD-001-L', 'L', '', 1895.00, null, 10, 5, true),
  (26, 7, 'HD-HOOD-001-XL', 'XL', '', 1895.00, null, 7, 5, true),
  (27, 7, 'HD-HOOD-001-XXL', 'XXL', '', 1895.00, null, 3, 5, true),
  (28, 8, 'HD-CREW-001-S', 'S', '', 1495.00, null, 8, 5, true),
  (29, 8, 'HD-CREW-001-M', 'M', '', 1495.00, null, 14, 5, true),
  (30, 8, 'HD-CREW-001-L', 'L', '', 1495.00, null, 11, 5, true),
  (31, 8, 'HD-CREW-001-XL', 'XL', '', 1495.00, null, 6, 5, true),
  (32, 8, 'HD-CREW-001-XXL', 'XXL', '', 1495.00, null, 2, 5, true),
  (33, 9, 'AC-TOTE-001-OS', 'OS', '', 450.00, null, 25, 5, true),
  (34, 10, 'AC-SOCK-001-OS', 'OS', '', 350.00, null, 40, 5, true)
on conflict (id) do nothing;

insert into public.events (
  id, title, slug, description, event_date, end_date, location_name,
  location_address, max_rsvp, status, is_featured
) values
  (1, '7SS Pop-Up Vol. 1', '7ss-popup-vol-1', 'Our first official pop-up with limited pieces and in-store exclusives.', '2024-12-14 12:00:00+08', '2024-12-14 20:00:00+08', 'The Collective BGC', 'Bonifacio Global City, Taguig, Metro Manila', 100, 'past', true),
  (2, '7SS Holiday Drop', '7ss-holiday-drop', 'A limited-run holiday collection presented for one day.', '2024-12-21 14:00:00+08', '2024-12-21 22:00:00+08', 'Cubao Expo', 'Araneta City, Cubao, Quezon City', 80, 'past', false)
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.categories', 'id'), (select max(id) from public.categories), true);
select setval(pg_get_serial_sequence('public.products', 'id'), (select max(id) from public.products), true);
select setval(pg_get_serial_sequence('public.product_variants', 'id'), (select max(id) from public.product_variants), true);
select setval(pg_get_serial_sequence('public.events', 'id'), (select max(id) from public.events), true);
