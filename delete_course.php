<?php /* delete_course.php - USER */
require_once '../db_config.php';
$user = requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
$courseId = (int)($data['course_id'] ?? 0);
if (!$courseId) jsonResponse(['success'=>false,'message'=>'Course ID required']);
$db = getDB();
$stmt = $db->prepare("DELETE FROM courses WHERE id=? AND seller_id=?");
$stmt->bind_param('ii', $courseId, $user['id']);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
