<?php
require_once __DIR__ . '/../../middleware/auth.php';

function getProductWithDetails(PDO $pdo, int $id): ?array {
    $stmt = $pdo->prepare('
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?
    ');
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    if (!$product) return null;
    // Images
    $imgs = $pdo->prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order');
    $imgs->execute([$id]);
    $product['images'] = $imgs->fetchAll();
    // Inventory
    $inv = $pdo->prepare('SELECT size, color, stock_quantity FROM inventory WHERE product_id = ? ORDER BY size');
    $inv->execute([$id]);
    $product['inventory'] = $inv->fetchAll();
    $product['total_stock'] = array_sum(array_column($product['inventory'], 'stock_quantity'));
    return $product;
}

switch ($method) {
    case 'GET':
        if ($id) {
            $product = getProductWithDetails($pdo, (int)$id);
            if (!$product) errorResponse('Product not found', 404);
            successResponse($product);
        } else {
            $page     = max(1, (int)($_GET['page'] ?? 1));
            $perPage  = min(50, (int)($_GET['per_page'] ?? 12));
            $offset   = ($page - 1) * $perPage;
            $where    = ['1=1'];
            $params   = [];
            if (isset($_GET['category'])) { $where[] = 'c.slug = ?'; $params[] = $_GET['category']; }
            if (isset($_GET['status']))   { $where[] = 'p.status = ?'; $params[] = $_GET['status']; }
            if (isset($_GET['featured'])) { $where[] = 'p.is_featured = 1'; }
            if (isset($_GET['search']))   { $where[] = 'p.name LIKE ?'; $params[] = '%' . $_GET['search'] . '%'; }
            $whereStr = implode(' AND ', $where);
            $count = $pdo->prepare("SELECT COUNT(*) FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE $whereStr");
            $count->execute($params);
            $total = (int)$count->fetchColumn();
            $stmt = $pdo->prepare("
                SELECT p.*, c.name as category_name,
                    (SELECT image_url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) as primary_image,
                    (SELECT SUM(stock_quantity) FROM inventory WHERE product_id=p.id) as total_stock
                FROM products p LEFT JOIN categories c ON c.id = p.category_id
                WHERE $whereStr ORDER BY p.created_at DESC LIMIT $perPage OFFSET $offset
            ");
            $stmt->execute($params);
            paginatedResponse($stmt->fetchAll(), $total, $page, $perPage);
        }
        break;

    case 'POST':
        requireAdmin();
        $body = json_decode(file_get_contents('php://input'), true);
        $required = ['name', 'price', 'category_id'];
        foreach ($required as $f) {
            if (empty($body[$f])) errorResponse("Field '$f' is required");
        }
        $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $body['name']));
        $stmt = $pdo->prepare('INSERT INTO products (category_id,name,slug,sku,description,price,compare_price,status,is_featured,has_sizes,meta_title,meta_description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([
            $body['category_id'], $body['name'], $body['slug'] ?? $slug,
            $body['sku'] ?? strtoupper(substr(md5(time()), 0, 8)),
            $body['description'] ?? null, $body['price'],
            $body['compare_price'] ?? null, $body['status'] ?? 'available',
            (int)($body['is_featured'] ?? 0), (int)($body['has_sizes'] ?? 1),
            $body['meta_title'] ?? null, $body['meta_description'] ?? null,
        ]);
        $newId = $pdo->lastInsertId();
        successResponse(getProductWithDetails($pdo, (int)$newId), 'Product created', 201);
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) errorResponse('Product ID required');
        $body = json_decode(file_get_contents('php://input'), true);
        $fields = [];
        $params = [];
        $allowed = ['name','slug','sku','description','price','compare_price','status','is_featured','has_sizes','category_id','meta_title','meta_description'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f=?"; $params[] = $body[$f]; }
        }
        if (!$fields) errorResponse('No fields to update');
        $params[] = $id;
        $pdo->prepare('UPDATE products SET ' . implode(',', $fields) . ' WHERE id=?')->execute($params);
        successResponse(getProductWithDetails($pdo, (int)$id), 'Product updated');
        break;

    case 'DELETE':
        requireAdmin();
        if (!$id) errorResponse('Product ID required');
        $pdo->prepare('DELETE FROM products WHERE id=?')->execute([$id]);
        successResponse(null, 'Product deleted');
        break;

    default:
        errorResponse('Method not allowed', 405);
}
