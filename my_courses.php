<?php /* my_courses.php */
require_once '../db_config.php';
$user = requireAuth();
$db = getDB();
$stmt = $db->prepare("SELECT * FROM courses_full WHERE seller_id=? ORDER BY created_at DESC");
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$courses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$db->close();
jsonResponse(['success'=>true,'courses'=>$courses]);
?>
