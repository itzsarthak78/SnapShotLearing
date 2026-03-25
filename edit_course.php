<?php /* edit_course.php */
require_once '../db_config.php';
$user = requireAuth();
$courseId = (int)($_POST['course_id'] ?? 0);
$name     = trim($_POST['name'] ?? '');
$price    = (float)($_POST['price'] ?? 0);
$desc     = trim($_POST['description'] ?? '');
if (!$courseId) jsonResponse(['success'=>false,'message'=>'Course ID required']);
$db = getDB();
// Verify ownership
$stmt = $db->prepare("SELECT id FROM courses WHERE id=? AND seller_id=?");
$stmt->bind_param('ii', $courseId, $user['id']);
$stmt->execute();
if (!$stmt->get_result()->fetch_assoc()) { $db->close(); jsonResponse(['success'=>false,'message'=>'Unauthorized']); }
$thumb = null;
if (!empty($_FILES['thumbnail']['tmp_name'])) {
    $thumb = uploadFile($_FILES['thumbnail'], 'thumbnails');
}
if ($thumb) {
    $upd = $db->prepare("UPDATE courses SET name=?,price=?,description=?,thumbnail=? WHERE id=?");
    $upd->bind_param('sdssi', $name, $price, $desc, $thumb, $courseId);
} else {
    $upd = $db->prepare("UPDATE courses SET name=?,price=?,description=? WHERE id=?");
    $upd->bind_param('sdsi', $name, $price, $desc, $courseId);
}
$upd->execute();
$db->close();
jsonResponse(['success'=>true]);
?>
