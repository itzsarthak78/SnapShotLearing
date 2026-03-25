<?php
require_once '../db_config.php';
$user = requireAuth();
$name     = trim($_POST['name'] ?? '');
$price    = (float)($_POST['price'] ?? 0);
$desc     = trim($_POST['description'] ?? '');
$category = $_POST['category'] ?? 'general';
$outcomes = $_POST['outcomes'] ?? '';
if (!$name || !$desc) jsonResponse(['success'=>false,'message'=>'Name and description required']);
$thumb = null;
if (!empty($_FILES['thumbnail']['tmp_name'])) {
    $thumb = uploadFile($_FILES['thumbnail'], 'thumbnails');
}
$db = getDB();
$stmt = $db->prepare("INSERT INTO courses (seller_id,name,price,description,category,thumbnail,outcomes,status) VALUES (?,?,?,?,?,?,'pending')");
$stmt->bind_param('isdsss', $user['id'], $name, $price, $desc, $category, $thumb, $outcomes);
if (!$stmt->execute()) { $db->close(); jsonResponse(['success'=>false,'message'=>'Failed to create course']); }
$courseId = $db->insert_id;
$db->close();
jsonResponse(['success'=>true,'course_id'=>$courseId]);
?>
