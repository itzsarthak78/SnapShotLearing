<?php /* update_profile.php */
require_once '../db_config.php';
$user = requireAuth();
$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
if (!$username) jsonResponse(['success'=>false,'message'=>'Username required']);
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) jsonResponse(['success'=>false,'message'=>'Invalid username format']);
$db = getDB();
$stmt = $db->prepare("UPDATE users SET username=? WHERE id=?");
$stmt->bind_param('si', $username, $user['id']);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
