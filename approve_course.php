<?php /* approve_course.php - admin */
require_once '../../db_config.php';
requireAdmin();
$data     = json_decode(file_get_contents('php://input'), true);
$courseId = (int)($data['course_id'] ?? 0);
$status   = $data['status'] ?? '';
$reason   = $data['reason'] ?? null;
if (!$courseId || !in_array($status, ['approved','rejected'])) jsonResponse(['success'=>false,'message'=>'Invalid data']);
$db = getDB();
$stmt = $db->prepare("UPDATE courses SET status=?, reject_reason=? WHERE id=?");
$stmt->bind_param('ssi', $status, $reason, $courseId);
$stmt->execute();
// Notify seller
$sellerStmt = $db->prepare("SELECT seller_id, name FROM courses WHERE id=?");
$sellerStmt->bind_param('i', $courseId);
$sellerStmt->execute();
$course = $sellerStmt->get_result()->fetch_assoc();
if ($course) {
    $icon = $status === 'approved' ? 'check-circle' : 'times-circle';
    $msg  = $status === 'approved'
        ? "Your course \"{$course['name']}\" has been approved and is now live!"
        : "Your course \"{$course['name']}\" was rejected." . ($reason ? " Reason: $reason" : '');
    $notif = $db->prepare("INSERT INTO notifications (user_id, message, icon) VALUES (?,?,?)");
    $notif->bind_param('iss', $course['seller_id'], $msg, $icon);
    $notif->execute();
}
$db->close();
jsonResponse(['success'=>true]);
?>
