<?php
require_once __DIR__ . '/../../middleware/auth.php';
requireAdmin();
switch ($method) {
    case 'GET':
        $lowOnly = isset($_GET['low_stock']);
        $where = $lowOnly ? 'WHERE i.stock_quantity <= i.low_stock_threshold' : '';
        $stmt = $pdo->query("SELECT i.*, p.name as product_name, p.sku as product_sku FROM inventory i JOIN products p ON p.id=i.product_id $where ORDER BY p.name, i.size");
        successResponse($stmt->fetchAll());
        break;
    case 'PUT':
        if (!$id) errorResponse('Inventory ID required');
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo->prepare('UPDATE inventory SET stock_quantity=? WHERE id=?')->execute([(int)$body['stock_quantity'], $id]);
        successResponse(null, 'Stock updated');
        break;
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        $pdo->prepare('INSERT INTO inventory (product_id,size,color,stock_quantity,low_stock_threshold) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE stock_quantity=VALUES(stock_quantity)')->execute([$body['product_id'], $body['size'] ?? 'OS', $body['color'] ?? null, $body['stock_quantity'] ?? 0, $body['low_stock_threshold'] ?? 5]);
        successResponse(null, 'Inventory updated', 201);
        break;
    default:
        errorResponse('Method not allowed', 405);
}
