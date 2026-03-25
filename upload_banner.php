<?php /* upload_banner.php - admin */
require_once '../../db_config.php';
requireAdmin();
$title   = trim($_POST['title'] ?? '');
$link    = trim($_POST['link'] ?? '');
if (empty($_FILES['banner']['tmp_name'])) jsonResponse(['success'=>false,'message'=>'Banner image required']);
$imageUrl = uploadFile($_FILES['banner'], 'banners', ['image/jpeg','image/png','image/webp','image/gif']);
if (!$imageUrl) jsonResponse(['success'=>false,'message'=>'Invalid image file']);
$db = getDB();
$stmt = $db->prepare("INSERT INTO banners (title, image_url, link_url, is_active) VALUES (?,?,?,1)");
$stmt->bind_param('sss', $title, $imageUrl, $link);
$stmt->execute();
$db->close();
jsonResponse(['success'=>true,'image_url'=>$imageUrl]);
?>
