<?php
function jsonResponse($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function successResponse($data, string $message = 'Success', int $status = 200): void {
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data], $status);
}
function errorResponse(string $message, int $status = 400, $errors = null): void {
    $body = ['success' => false, 'message' => $message];
    if ($errors !== null) $body['errors'] = $errors;
    jsonResponse($body, $status);
}
function paginatedResponse(array $data, int $total, int $page, int $perPage): void {
    jsonResponse(['success' => true, 'data' => $data, 'meta' => [
        'total' => $total, 'page' => $page, 'per_page' => $perPage,
        'last_page' => (int) ceil($total / $perPage),
    ]]);
}
