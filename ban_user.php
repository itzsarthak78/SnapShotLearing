<?php /* ban_user.php - admin */
require_once '../../db_config.php';
requireAdmin();
$data   = json_decode(file_get_contents('php://input'), true);
$userId = (int)($data['user_id'] ?? 0);
if (!$userId) jsonResponse(['success'=>false,'message'=>'User ID required']);
$db = getDB();
$stmt = $db->prepare("UPDATE users SET is_banned=1 WHERE id=?");
$stmt->bind_param('i', $userId);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
