<?php
require_once __DIR__ . '/../../middleware/auth.php';
switch ($method) {
    case 'GET':
        requireAdmin();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 20;
        $offset = ($page - 1) * $perPage;
        $total = (int)$pdo->query('SELECT COUNT(*) FROM customers')->fetchColumn();
        $stmt = $pdo->query("SELECT id, first_name, last_name, email, phone, created_at FROM customers ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
        paginatedResponse($stmt->fetchAll(), $total, $page, $perPage);
        break;
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        if (empty($body['email']) || empty($body['first_name'])) errorResponse('Name and email required');
        try {
            $hash = !empty($body['password']) ? password_hash($body['password'], PASSWORD_BCRYPT) : null;
            $pdo->prepare('INSERT INTO customers (first_name,last_name,email,phone,password_hash) VALUES (?,?,?,?,?)')->execute([$body['first_name'], $body['last_name'] ?? '', $body['email'], $body['phone'] ?? null, $hash]);
            successResponse(['id' => $pdo->lastInsertId()], 'Customer created', 201);
        } catch (PDOException $e) {
            errorResponse('Email already registered');
        }
        break;
    default:
        errorResponse('Method not allowed', 405);
}
