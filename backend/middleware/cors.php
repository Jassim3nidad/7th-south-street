<?php
function handleCors(): void {
    $allowed = $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000';
    $origins = explode(',', $allowed);
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $origins) || str_ends_with($origin, '.vercel.app')) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=UTF-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
