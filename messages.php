<?php /* messages.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$result = $db->query("
    SELECT hm.*, u.username
    FROM help_messages hm
    JOIN users u ON hm.user_id = u.id
    ORDER BY hm.created_at DESC
");
$messages = $result->fetch_all(MYSQLI_ASSOC);
// Mark all as read
$db->query("UPDATE help_messages SET is_read=1");
// Format time
foreach ($messages as &$m) {
    $diff = time() - strtotime($m['created_at']);
    if ($diff < 3600) $m['created_at'] = floor($diff/60).'m ago';
    elseif ($diff < 86400) $m['created_at'] = floor($diff/3600).'h ago';
    else $m['created_at'] = date('d M Y', strtotime($m['created_at']));
}
$db->close();
jsonResponse(['success'=>true,'messages'=>$messages]);
?>
