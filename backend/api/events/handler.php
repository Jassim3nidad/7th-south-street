<?php
require_once __DIR__ . '/../../middleware/auth.php';

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM events WHERE id=? OR slug=? LIMIT 1');
            $stmt->execute([$id, $id]);
            $event = $stmt->fetch();
            if (!$event) errorResponse('Event not found', 404);
            $gallery = $pdo->prepare('SELECT * FROM event_gallery WHERE event_id=? ORDER BY sort_order');
            $gallery->execute([$event['id']]);
            $event['gallery'] = $gallery->fetchAll();
            successResponse($event);
        } else {
            $status = $_GET['status'] ?? null;
            $where = $status ? "WHERE status=?" : "WHERE 1=1";
            $params = $status ? [$status] : [];
            if (!isset($_GET['all'])) { $where .= " AND status != 'cancelled'"; }
            $stmt = $pdo->prepare("SELECT * FROM events $where ORDER BY event_date ASC");
            $stmt->execute($params);
            successResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        if ($sub === 'rsvp') {
            $body = json_decode(file_get_contents('php://input'), true);
            if (empty($body['email']) || empty($body['name'])) errorResponse('Name and email required');
            $stmt = $pdo->prepare('SELECT id, max_rsvp, rsvp_count FROM events WHERE id=?');
            $stmt->execute([$id]);
            $event = $stmt->fetch();
            if (!$event) errorResponse('Event not found', 404);
            if ($event['max_rsvp'] > 0 && $event['rsvp_count'] >= $event['max_rsvp']) errorResponse('This event is fully booked');
            try {
                $pdo->prepare('INSERT INTO event_rsvps (event_id,name,email,phone) VALUES (?,?,?,?)')->execute([$id, $body['name'], $body['email'], $body['phone'] ?? null]);
                $pdo->prepare('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id=?')->execute([$id]);
                successResponse(null, 'RSVP confirmed!', 201);
            } catch (PDOException $e) {
                errorResponse('You have already RSVP\'d for this event');
            }
        } else {
            requireAdmin();
            $body = json_decode(file_get_contents('php://input'), true);
            if (empty($body['title']) || empty($body['event_date'])) errorResponse('Title and event date required');
            $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $body['title'])) . '-' . date('Y');
            $pdo->prepare('INSERT INTO events (title,slug,description,event_date,end_date,location_name,location_address,poster_url,max_rsvp,status,is_featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)')->execute([$body['title'], $body['slug'] ?? $slug, $body['description'] ?? null, $body['event_date'], $body['end_date'] ?? null, $body['location_name'] ?? null, $body['location_address'] ?? null, $body['poster_url'] ?? null, $body['max_rsvp'] ?? 0, $body['status'] ?? 'upcoming', (int)($body['is_featured'] ?? 0)]);
            successResponse(['id' => $pdo->lastInsertId()], 'Event created', 201);
        }
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) errorResponse('Event ID required');
        $body = json_decode(file_get_contents('php://input'), true);
        $fields = []; $params = [];
        foreach (['title','description','event_date','end_date','location_name','location_address','poster_url','max_rsvp','status','is_featured'] as $f) {
            if (array_key_exists($f, $body)) { $fields[] = "$f=?"; $params[] = $body[$f]; }
        }
        if (!$fields) errorResponse('Nothing to update');
        $params[] = $id;
        $pdo->prepare('UPDATE events SET ' . implode(',', $fields) . ' WHERE id=?')->execute($params);
        successResponse(null, 'Event updated');
        break;

    case 'DELETE':
        requireAdmin();
        if (!$id) errorResponse('Event ID required');
        $pdo->prepare('DELETE FROM events WHERE id=?')->execute([$id]);
        successResponse(null, 'Event deleted');
        break;

    default:
        errorResponse('Method not allowed', 405);
}
