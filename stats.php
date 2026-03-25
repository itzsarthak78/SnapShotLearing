<?php /* stats.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$users   = $db->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$courses = $db->query("SELECT COUNT(*) as c FROM courses WHERE status='approved'")->fetch_assoc()['c'];
$pending = $db->query("SELECT COUNT(*) as c FROM courses WHERE status='pending'")->fetch_assoc()['c'];
$msgs    = $db->query("SELECT COUNT(*) as c FROM help_messages WHERE is_read=0")->fetch_assoc()['c'];

$activity_result = $db->query("
    (SELECT 'user-plus' AS icon, CONCAT('New user: ', username) AS text, created_at AS time FROM users ORDER BY created_at DESC LIMIT 3)
    UNION ALL
    (SELECT 'book' AS icon, CONCAT('Course submitted: ', name) AS text, created_at AS time FROM courses ORDER BY created_at DESC LIMIT 3)
    UNION ALL
    (SELECT 'envelope' AS icon, CONCAT('Help message from user #', user_id) AS text, created_at AS time FROM help_messages ORDER BY created_at DESC LIMIT 3)
    ORDER BY time DESC LIMIT 8
");
$activity = $activity_result->fetch_all(MYSQLI_ASSOC);
// Format times
foreach ($activity as &$a) {
    $diff = time() - strtotime($a['time']);
    if ($diff < 60) $a['time'] = 'Just now';
    elseif ($diff < 3600) $a['time'] = floor($diff/60).'m ago';
    elseif ($diff < 86400) $a['time'] = floor($diff/3600).'h ago';
    else $a['time'] = floor($diff/86400).'d ago';
}
$db->close();
jsonResponse(['success'=>true,'stats'=>['users'=>$users,'courses'=>$courses,'pending'=>$pending,'messages'=>$msgs],'activity'=>$activity]);
?>
