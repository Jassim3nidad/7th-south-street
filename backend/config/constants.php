<?php
// backend/config/constants.php
$jwtSecret = $_ENV['JWT_SECRET'] ?? '';
if (!is_string($jwtSecret) || strlen($jwtSecret) < 32) {
    throw new RuntimeException('JWT_SECRET must be configured with at least 32 characters');
}
define('JWT_SECRET',   $jwtSecret);
define('JWT_EXPIRY',   $_ENV['JWT_EXPIRY']  ?? 86400); // 24 hours
define('CORS_ORIGIN',  $_ENV['CORS_ORIGIN'] ?? 'http://localhost:3000');
define('UPLOAD_DIR',   __DIR__ . '/../uploads/');
define('UPLOAD_URL',   '/uploads/');
define('MAX_UPLOAD',   (int)($_ENV['UPLOAD_MAX_SIZE'] ?? 5242880)); // 5MB
define('ALLOWED_IMG',  ['image/jpeg', 'image/png', 'image/webp']);
