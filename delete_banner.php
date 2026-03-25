<?php /* delete_banner.php - admin */
require_once '../../db_config.php';
requireAdmin();
$data     = json_decode(file_get_contents('php://input'), true);
$bannerId = (int)($data['banner_id'] ?? 0);
if (!$bannerId) jsonResponse(['success'=>false,'message'=>'Banner ID required']);
$db = getDB();
$stmt = $db->prepare("DELETE FROM banners WHERE id=?");
$stmt->bind_param('i', $bannerId);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
