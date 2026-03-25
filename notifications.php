<?php /* notifications.php */
require_once '../db_config.php';
$user = requireAuth();
$db = getDB();
$stmt = $db->prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20");
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$notifs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
// Mark as read
$db->prepare("UPDATE notifications SET is_read=1 WHERE user_id=?")->execute(... [$user['id']]);
$db->close();
jsonResponse(['success'=>true,'notifications'=>$notifs]);
?>
