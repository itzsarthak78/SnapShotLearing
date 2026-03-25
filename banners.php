<?php /* banners.php */
require_once '../db_config.php';
$db = getDB();
$result = $db->query("SELECT * FROM banners WHERE is_active=1 ORDER BY sort_order ASC, created_at DESC");
$banners = $result->fetch_all(MYSQLI_ASSOC);
$db->close();
jsonResponse(['success'=>true,'banners'=>$banners]);
?>
