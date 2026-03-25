<?php /* help.php */
require_once '../db_config.php';
$user = requireAuth();
$data    = json_decode(file_get_contents('php://input'), true);
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');
if (!$message) jsonResponse(['success'=>false,'message'=>'Message required']);
$db = getDB();
$stmt = $db->prepare("INSERT INTO help_messages (user_id,subject,message) VALUES (?,?,?)");
$stmt->bind_param('iss', $user['id'], $subject, $message);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
