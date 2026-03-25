<?php /* purchase.php */
require_once '../db_config.php';
$user = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$courseId  = (int)($data['course_id'] ?? 0);
$paymentId = $data['payment_id'] ?? null;
$amount    = (float)($data['amount'] ?? 0);
if (!$courseId) jsonResponse(['success'=>false,'message'=>'Invalid course']);
$db = getDB();
$stmt = $db->prepare("INSERT IGNORE INTO purchases (user_id, course_id, amount, payment_id) VALUES (?,?,?,?)");
$stmt->bind_param('iids', $user['id'], $courseId, $amount, $paymentId);
$stmt->execute();
// Notify seller
$sellerStmt = $db->prepare("SELECT seller_id FROM courses WHERE id = ?");
$sellerStmt->bind_param('i', $courseId);
$sellerStmt->execute();
$seller = $sellerStmt->get_result()->fetch_assoc();
if ($seller) {
    $msg = "Someone purchased your course!";
    $notifStmt = $db->prepare("INSERT INTO notifications (user_id, message, icon) VALUES (?,?,'shopping-cart')");
    $notifStmt->bind_param('is', $seller['seller_id'], $msg);
    $notifStmt->execute();
}
$db->close();
jsonResponse(['success'=>true]);
?>
