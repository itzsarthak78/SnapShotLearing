<?php
require_once '../db_config.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(['success' => false, 'message' => 'Email and password required']);
}

$db = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_banned = 0");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user || !password_verify($password, $user['password'])) {
    $db->close();
    jsonResponse(['success' => false, 'message' => 'Invalid email or password']);
}

// Update last login
$db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute(... [$user['id']]);

// Get purchased course IDs
$stmt2 = $db->prepare("SELECT course_id FROM purchases WHERE user_id = ?");
$stmt2->bind_param('i', $user['id']);
$stmt2->execute();
$purchased = array_column($stmt2->get_result()->fetch_all(MYSQLI_ASSOC), 'course_id');

// Get created course IDs
$stmt3 = $db->prepare("SELECT id FROM courses WHERE seller_id = ?");
$stmt3->bind_param('i', $user['id']);
$stmt3->execute();
$created = array_column($stmt3->get_result()->fetch_all(MYSQLI_ASSOC), 'id');

// Review count
$stmt4 = $db->prepare("SELECT COUNT(*) as cnt FROM reviews WHERE user_id = ?");
$stmt4->bind_param('i', $user['id']);
$stmt4->execute();
$reviews = $stmt4->get_result()->fetch_assoc()['cnt'];

$db->close();

jsonResponse([
    'success' => true,
    'user' => [
        'id'        => $user['id'],
        'username'  => $user['username'],
        'email'     => $user['email'],
        'purchased' => $purchased,
        'created'   => $created,
        'reviews'   => (int)$reviews,
    ]
]);
?>
