<?php /* add_video.php */
require_once '../db_config.php';
$user = requireAuth();
$courseId = (int)($_POST['course_id'] ?? 0);
$title    = trim($_POST['title'] ?? '');
if (!$courseId || !$title) jsonResponse(['success'=>false,'message'=>'Course ID and title required']);
// Verify ownership
$db = getDB();
$stmt = $db->prepare("SELECT id FROM courses WHERE id = ? AND seller_id = ?");
$stmt->bind_param('ii', $courseId, $user['id']);
$stmt->execute();
if (!$stmt->get_result()->fetch_assoc()) { $db->close(); jsonResponse(['success'=>false,'message'=>'Unauthorized']); }
$videoUrl = null;
if (!empty($_FILES['video']['tmp_name'])) {
    $videoUrl = uploadFile($_FILES['video'], 'videos', ['video/mp4','video/webm','video/quicktime','video/x-msvideo']);
}
$orderStmt = $db->prepare("SELECT COUNT(*) as cnt FROM course_videos WHERE course_id = ?");
$orderStmt->bind_param('i', $courseId);
$orderStmt->execute();
$order = (int)$orderStmt->get_result()->fetch_assoc()['cnt'];
$ins = $db->prepare("INSERT INTO course_videos (course_id, title, video_url, sort_order) VALUES (?,?,?,?)");
$ins->bind_param('issi', $courseId, $title, $videoUrl, $order);
$ins->execute();
$db->close();
jsonResponse(['success'=>true,'video_id'=>$db->insert_id]);
?>
