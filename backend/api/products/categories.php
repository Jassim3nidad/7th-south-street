<?php
switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order');
        successResponse($stmt->fetchAll());
        break;
    case 'POST':
        requireAdmin();
        $body = json_decode(file_get_contents('php://input'), true);
        if (empty($body['name'])) errorResponse('Category name required');
        $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $body['name']));
        $pdo->prepare('INSERT INTO categories (name,slug,description,sort_order) VALUES (?,?,?,?)')->execute([$body['name'], $body['slug'] ?? $slug, $body['description'] ?? null, $body['sort_order'] ?? 0]);
        successResponse(['id' => $pdo->lastInsertId()], 'Category created', 201);
        break;
    default:
        errorResponse('Method not allowed', 405);
}
