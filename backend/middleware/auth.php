<?php
function requireAdmin(): array {
    $token = getBearerToken();
    if (!$token) errorResponse('Authentication required', 401);
    $payload = jwtVerify($token);
    if (!$payload || !isset($payload['admin_id'])) errorResponse('Invalid or expired token', 401);
    return $payload;
}
function optionalAdmin(): ?array {
    $token = getBearerToken();
    if (!$token) return null;
    return jwtVerify($token);
}
