<?php
require_once __DIR__ . '/../../middleware/auth.php';
requireAdmin();
$totalOrders = $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
$totalRevenue = $pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE payment_status='paid'")->fetchColumn();
$totalProducts = $pdo->query("SELECT COUNT(*) FROM products WHERE status != 'archived'")->fetchColumn();
$totalCustomers = $pdo->query('SELECT COUNT(*) FROM customers')->fetchColumn();
$recentOrders = $pdo->query('SELECT id, order_number, shipping_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5')->fetchAll();
$lowStock = $pdo->query('SELECT p.name, i.size, i.stock_quantity FROM inventory i JOIN products p ON p.id=i.product_id WHERE i.stock_quantity <= i.low_stock_threshold AND i.stock_quantity > 0 ORDER BY i.stock_quantity LIMIT 10')->fetchAll();
$salesByMonth = $pdo->query("SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as orders, SUM(total) as revenue FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND payment_status='paid' GROUP BY month ORDER BY month")->fetchAll();
$topProducts = $pdo->query('SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.subtotal) as revenue FROM order_items oi JOIN products p ON p.id=oi.product_id GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 5')->fetchAll();
successResponse(['overview' => ['total_orders' => (int)$totalOrders, 'total_revenue' => (float)$totalRevenue, 'total_products' => (int)$totalProducts, 'total_customers' => (int)$totalCustomers], 'recent_orders' => $recentOrders, 'low_stock' => $lowStock, 'sales_by_month' => $salesByMonth, 'top_products' => $topProducts]);
