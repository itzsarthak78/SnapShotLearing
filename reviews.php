<?php
require_once '../db_config.php';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $courseId = (int)($_GET['course_id'] ?? 0);
    if (!$courseId) jsonResponse(['success'=>false,'message'=>'Course ID required']);
    $db = getDB();
    $stmt = $db->prepare("SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.course_id=? ORDER BY r.created_at DESC");
    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $reviews = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $db->close();
    jsonResponse(['success'=>true,'reviews'=>$reviews]);
} else {
    $user = requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $courseId = (int)($data['course_id'] ?? 0);
    $rating   = (int)($data['rating'] ?? 0);
    $review   = trim($data['review'] ?? '');
    if (!$courseId || $rating < 1 || $rating > 5) jsonResponse(['success'=>false,'message'=>'Invalid data']);
    // Must have purchased
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM purchases WHERE user_id=? AND course_id=?");
    $stmt->bind_param('ii', $user['id'], $courseId);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) { $db->close(); jsonResponse(['success'=>false,'message'=>'Purchase the course to review']); }
    $ins = $db->prepare("INSERT INTO reviews (user_id,course_id,rating,review) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),review=VALUES(review)");
    $ins->bind_param('iiis', $user['id'], $courseId, $rating, $review);
    $ins->execute();
    $db->close();
    jsonResponse(['success'=>true]);
}
?>
