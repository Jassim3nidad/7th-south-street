<?php
require_once __DIR__ . '/../../middleware/auth.php';
requireAdmin();
if ($method !== 'POST') errorResponse('Method not allowed', 405);
if (empty($_FILES['image'])) errorResponse('No image file provided');
$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) errorResponse('Upload failed');
if ($file['size'] > MAX_UPLOAD) errorResponse('File too large. Max 5MB');
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, ALLOWED_IMG)) errorResponse('Only JPEG, PNG, WebP allowed');
$ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime];
$folder = $_GET['folder'] ?? 'products';
$dir = UPLOAD_DIR . $folder . '/';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$filename = uniqid() . '_' . time() . '.' . $ext;
if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) errorResponse('Failed to save file');
successResponse(['url' => UPLOAD_URL . $folder . '/' . $filename, 'filename' => $filename], 'Uploaded', 201);
