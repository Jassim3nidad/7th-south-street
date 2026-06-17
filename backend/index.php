<?php
// =============================================================
// 7TH SOUTH STREET — PHP REST API Entry Point
// =============================================================

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/middleware/auth.php';

// ── CORS ────────────────────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter([
    CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001',
]);
if (in_array($origin, $allowedOrigins) || preg_match('/\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── PARSE REQUEST ────────────────────────────────────────────
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim(preg_replace('#^/?api#', '', $uri), '/');
$method = $_SERVER['REQUEST_METHOD'];
$parts  = array_values(array_filter(explode('/', $uri)));

$resource = $parts[0] ?? '';
$id       = $parts[1] ?? null;
$sub      = $parts[2] ?? null;

// ── ROUTE ────────────────────────────────────────────────────
$handlers = [
    'auth'       => __DIR__ . '/api/auth/handler.php',
    'products'   => __DIR__ . '/api/products/handler.php',
    'categories' => __DIR__ . '/api/products/categories.php',
    'orders'     => __DIR__ . '/api/orders/handler.php',
    'events'     => __DIR__ . '/api/events/handler.php',
    'customers'  => __DIR__ . '/api/customers/handler.php',
    'inventory'  => __DIR__ . '/api/inventory/handler.php',
    'newsletter' => __DIR__ . '/api/newsletter/handler.php',
    'dashboard'  => __DIR__ . '/api/dashboard/handler.php',
    'upload'     => __DIR__ . '/api/upload/handler.php',
];

if (isset($handlers[$resource])) {
    require $handlers[$resource];
} elseif ($resource === '') {
    successResponse(['name' => '7Th South Street API', 'version' => '1.0', 'status' => 'online']);
} else {
    errorResponse("Route '$resource' not found", 404);
}
