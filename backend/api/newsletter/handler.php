<?php
switch ($method) {
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        $email = filter_var(trim($body['email'] ?? ''), FILTER_VALIDATE_EMAIL);
        if (!$email) errorResponse('Valid email required');
        try {
            $pdo->prepare('INSERT INTO newsletter_subscribers (email,name) VALUES (?,?) ON DUPLICATE KEY UPDATE is_active=1,unsubscribed_at=NULL')->execute([$email, $body['name'] ?? null]);
            successResponse(null, 'Subscribed!', 201);
        } catch (PDOException $e) { errorResponse('Could not subscribe'); }
        break;
    default: errorResponse('Method not allowed', 405);
}
