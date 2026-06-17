<?php
// ============================================
// API BOOTSTRAP & ROUTER
// 7TH SOUTH STREET
// ============================================

define('ROOT_PATH', dirname(__DIR__));

require_once ROOT_PATH . '/config/database.php';
require_once ROOT_PATH . '/middleware/cors.php';
require_once ROOT_PATH . '/middleware/auth.php';
require_once ROOT_PATH . '/utils/response.php';
require_once ROOT_PATH . '/utils/validate.php';

// Load .env if exists
if (file_exists(ROOT_PATH . '/.env')) {
    $lines = file(ROOT_PATH . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            [$key, $val] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($val);
        }
    }
}

// Handle CORS preflight
handleCors();

// Parse request
$method  = $_SERVER['REQUEST_METHOD'];
$uri     = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri     = rtrim(str_replace('/api', '', $uri), '/');
$parts   = explode('/', trim($uri, '/'));
$resource = $parts[0] ?? '';
$id       = $parts[1] ?? null;

// Route map
$routes = [
    'auth'      => ROOT_PATH . '/api/auth/handler.php',
    'products'  => ROOT_PATH . '/api/products/handler.php',
    'categories'=> ROOT_PATH . '/api/categories/handler.php',
    'orders'    => ROOT_PATH . '/api/orders/handler.php',
    'events'    => ROOT_PATH . '/api/events/handler.php',
    'customers' => ROOT_PATH . '/api/customers/handler.php',
    'inventory' => ROOT_PATH . '/api/inventory/handler.php',
    'newsletter'=> ROOT_PATH . '/api/newsletter/handler.php',
    'rsvp'      => ROOT_PATH . '/api/rsvp/handler.php',
    'dashboard' => ROOT_PATH . '/api/dashboard/handler.php',
];

if (isset($routes[$resource])) {
    // Pass parsed params to handlers
    $GLOBALS['request'] = [
        'method'   => $method,
        'resource' => $resource,
        'id'       => $id,
        'parts'    => $parts,
        'body'     => json_decode(file_get_contents('php://input'), true) ?? [],
        'query'    => $_GET,
    ];
    require_once $routes[$resource];
} else {
    Response::json(['error' => 'Route not found'], 404);
}
