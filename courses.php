<?php
require_once '../db_config.php';

$db = getDB();
$result = $db->query("SELECT * FROM courses_full WHERE status = 'approved' ORDER BY purchase_count DESC, created_at DESC");
$courses = $result->fetch_all(MYSQLI_ASSOC);
$db->close();

jsonResponse(['success'=>true,'courses'=>$courses]);
?>
