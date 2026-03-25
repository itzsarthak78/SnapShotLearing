<?php /* banners.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$result = $db->query("SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC");
$banners = $result->fetch_all(MYSQLI_ASSOC);
$db->close();
jsonResponse(['success'=>true,'banners'=>$banners]);
?>
