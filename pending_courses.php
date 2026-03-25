<?php /* pending_courses.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$result = $db->query("SELECT * FROM courses_full WHERE status='pending' ORDER BY created_at ASC");
$courses = $result->fetch_all(MYSQLI_ASSOC);
$db->close();
jsonResponse(['success'=>true,'courses'=>$courses]);
?>
