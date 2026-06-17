<?php
require_once __DIR__ . '/../../middleware/auth.php';
$action = $parts[1] ?? '';
switch ($method . ':' . $action) {
    case 'POST:login':
        $body = json_decode(file_get_contents('php://input'), true);
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        if (!$email || !$password) errorResponse('Email and password are required');
        $stmt = $pdo->prepare('SELECT * FROM admins WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $admin = $stmt->fetch();
        if (!$admin || !password_verify($password, $admin['password_hash'])) errorResponse('Invalid credentials', 401);
        $pdo->prepare('UPDATE admins SET last_login = NOW() WHERE id = ?')->execute([$admin['id']]);
        $token = jwtCreate(['admin_id' => $admin['id'], 'email' => $admin['email'], 'role' => $admin['role']]);
        successResponse(['token' => $token, 'admin' => ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role']]], 'Login successful');
        break;
    case 'POST:logout':
        successResponse(null, 'Logged out');
        break;
    case 'GET:me':
        $payload = requireAdmin();
        $stmt = $pdo->prepare('SELECT id, name, email, role, last_login FROM admins WHERE id = ?');
        $stmt->execute([$payload['admin_id']]);
        successResponse($stmt->fetch());
        break;
    default:
        errorResponse('Auth route not found', 404);
}
