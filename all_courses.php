<?php /* all_courses.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$result = $db->query("SELECT * FROM courses_full ORDER BY created_at DESC");
$courses = $result->fetch_all(MYSQLI_ASSOC);
$db->close();
jsonResponse(['success'=>true,'courses'=>$courses]);
?>
