<?php /* delete_course.php - admin */
require_once '../../db_config.php';
requireAdmin();
$data     = json_decode(file_get_contents('php://input'), true);
$courseId = (int)($data['course_id'] ?? 0);
if (!$courseId) jsonResponse(['success'=>false,'message'=>'Course ID required']);
$db = getDB();
$stmt = $db->prepare("DELETE FROM courses WHERE id=?");
$stmt->bind_param('i', $courseId);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
