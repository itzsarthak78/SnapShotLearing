<?php /* change_password.php */
require_once '../db_config.php';
$user = requireAuth();
$data     = json_decode(file_get_contents('php://input'), true);
$password = $data['password'] ?? '';
if (strlen($password) < 6) jsonResponse(['success'=>false,'message'=>'Password too short']);
$hash = password_hash($password, PASSWORD_BCRYPT);
$db = getDB();
$stmt = $db->prepare("UPDATE users SET password=? WHERE id=?");
$stmt->bind_param('si', $hash, $user['id']);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
