<?php
// backend/config/constants.php
define('JWT_SECRET',   $_ENV['JWT_SECRET']  ?? 'change-this-secret-in-production');
define('JWT_EXPIRY',   $_ENV['JWT_EXPIRY']  ?? 86400); // 24 hours
define('CORS_ORIGIN',  $_ENV['CORS_ORIGIN'] ?? 'http://localhost:3000');
define('UPLOAD_DIR',   __DIR__ . '/../uploads/');
define('UPLOAD_URL',   '/uploads/');
define('MAX_UPLOAD',   (int)($_ENV['UPLOAD_MAX_SIZE'] ?? 5242880)); // 5MB
define('ALLOWED_IMG',  ['image/jpeg', 'image/png', 'image/webp']);
