<?php /* broadcast.php - user side: check for active broadcast */
require_once '../db_config.php';
$user = requireAuth();
$db = getDB();
// Check for broadcast targeted to this user or all
$stmt = $db->prepare("SELECT message FROM broadcasts WHERE is_active=1 AND (target_type='all' OR (target_type='specific' AND target_user_id=?)) ORDER BY created_at DESC LIMIT 1");
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$db->close();
jsonResponse(['success'=>true,'message'=>$row ? $row['message'] : null]);
?>
