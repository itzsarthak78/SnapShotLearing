<?php /* broadcast.php - admin send */
require_once '../../db_config.php';
requireAdmin();
$data       = json_decode(file_get_contents('php://input'), true);
$target     = $data['target'] ?? 'all';
$message    = trim($data['message'] ?? '');
$targetUser = trim($data['user'] ?? '');
if (!$message) jsonResponse(['success'=>false,'message'=>'Message required']);
$db = getDB();
$targetUserId = null;
if ($target === 'specific' && $targetUser) {
    $uStmt = $db->prepare("SELECT id FROM users WHERE username=? OR email=?");
    $uStmt->bind_param('ss', $targetUser, $targetUser);
    $uStmt->execute();
    $u = $uStmt->get_result()->fetch_assoc();
    if ($u) $targetUserId = $u['id'];
}
$stmt = $db->prepare("INSERT INTO broadcasts (target_type, target_user_id, message, is_active) VALUES (?,?,?,1)");
$stmt->bind_param('sis', $target, $targetUserId, $message);
$stmt->execute();
// Also create notification
if ($target === 'all') {
    $usersResult = $db->query("SELECT id FROM users WHERE is_banned=0");
    while ($u = $usersResult->fetch_assoc()) {
        $ns = $db->prepare("INSERT INTO notifications (user_id, message, icon) VALUES (?,'$message','bullhorn')");
        $ns->bind_param('i', $u['id']);
        $ns->execute();
    }
} elseif ($targetUserId) {
    $ns = $db->prepare("INSERT INTO notifications (user_id, message, icon) VALUES (?,'$message','bullhorn')");
    $ns->bind_param('i', $targetUserId);
    $ns->execute();
}
$db->close();
jsonResponse(['success'=>true]);
?>
