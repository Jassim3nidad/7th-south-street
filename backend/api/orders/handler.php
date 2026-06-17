<?php
require_once __DIR__ . '/../../middleware/auth.php';

function generateOrderNumber(PDO $pdo): string {
    do {
        $num = '7SS-' . strtoupper(substr(md5(uniqid()), 0, 8));
        $exists = $pdo->prepare('SELECT id FROM orders WHERE order_number=?');
        $exists->execute([$num]);
    } while ($exists->fetch());
    return $num;
}

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT o.*, GROUP_CONCAT(oi.product_name SEPARATOR ", ") as items_summary FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.id=? GROUP BY o.id');
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            if (!$order) errorResponse('Order not found', 404);
            $items = $pdo->prepare('SELECT * FROM order_items WHERE order_id=?');
            $items->execute([$id]);
            $order['items'] = $items->fetchAll();
            successResponse($order);
        } else {
            requireAdmin();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = 20;
            $offset = ($page - 1) * $perPage;
            $status = $_GET['status'] ?? null;
            $where = $status ? 'WHERE status=?' : '';
            $params = $status ? [$status] : [];
            $total = $pdo->prepare("SELECT COUNT(*) FROM orders $where");
            $total->execute($params);
            $count = (int)$total->fetchColumn();
            $stmt = $pdo->prepare("SELECT * FROM orders $where ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
            $stmt->execute($params);
            paginatedResponse($stmt->fetchAll(), $count, $page, $perPage);
        }
        break;

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        if (empty($body['items']) || !is_array($body['items'])) errorResponse('Order items required');
        $orderNum = generateOrderNumber($pdo);
        $subtotal = 0;
        foreach ($body['items'] as $item) {
            $subtotal += ($item['unit_price'] * $item['quantity']);
        }
        $shipping = (float)($body['shipping_fee'] ?? 0);
        $total = $subtotal + $shipping;
        $stmt = $pdo->prepare('INSERT INTO orders (order_number,customer_id,guest_email,payment_method,shipping_name,shipping_email,shipping_phone,shipping_address,shipping_city,shipping_province,shipping_postal,subtotal,shipping_fee,total,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([$orderNum, $body['customer_id'] ?? null, $body['guest_email'] ?? null, $body['payment_method'] ?? 'cod', $body['shipping_name'] ?? null, $body['shipping_email'] ?? null, $body['shipping_phone'] ?? null, $body['shipping_address'] ?? null, $body['shipping_city'] ?? null, $body['shipping_province'] ?? null, $body['shipping_postal'] ?? null, $subtotal, $shipping, $total, $body['notes'] ?? null]);
        $orderId = $pdo->lastInsertId();
        foreach ($body['items'] as $item) {
            $pdo->prepare('INSERT INTO order_items (order_id,product_id,product_name,sku,size,color,unit_price,quantity,subtotal) VALUES (?,?,?,?,?,?,?,?,?)')->execute([$orderId, $item['product_id'] ?? null, $item['product_name'], $item['sku'] ?? null, $item['size'] ?? null, $item['color'] ?? null, $item['unit_price'], $item['quantity'], $item['unit_price'] * $item['quantity']]);
            // Deduct stock
            if (!empty($item['product_id']) && !empty($item['size'])) {
                $pdo->prepare('UPDATE inventory SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id=? AND size=?')->execute([$item['quantity'], $item['product_id'], $item['size']]);
            }
        }
        successResponse(['order_id' => $orderId, 'order_number' => $orderNum, 'total' => $total], 'Order placed', 201);
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) errorResponse('Order ID required');
        $body = json_decode(file_get_contents('php://input'), true);
        $fields = []; $params = [];
        foreach (['status','payment_status','payment_reference','notes'] as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f=?"; $params[] = $body[$f]; }
        }
        if (!$fields) errorResponse('Nothing to update');
        $params[] = $id;
        $pdo->prepare('UPDATE orders SET ' . implode(',', $fields) . ' WHERE id=?')->execute($params);
        successResponse(null, 'Order updated');
        break;

    default:
        errorResponse('Method not allowed', 405);
}
