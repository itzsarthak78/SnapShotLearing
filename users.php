<?php /* users.php - admin */
require_once '../../db_config.php';
requireAdmin();
$db = getDB();
$result = $db->query("
    SELECT u.id, u.username, u.email, u.is_banned, u.created_at,
           COUNT(DISTINCT p.id) AS purchases,
           COUNT(DISTINCT c.id) AS courses_created
    FROM users u
    LEFT JOIN purchases p ON p.user_id = u.id
    LEFT JOIN courses c ON c.seller_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
");
$users = $result->fetch_all(MYSQLI_ASSOC);
// Format joined date
foreach ($users as &$u) {
    $diff = time() - strtotime($u['created_at']);
    if ($diff < 86400) $u['joined'] = 'Today';
    elseif ($diff < 604800) $u['joined'] = floor($diff/86400).' days ago';
    elseif ($diff < 2592000) $u['joined'] = floor($diff/604800).' weeks ago';
    else $u['joined'] = date('d M Y', strtotime($u['created_at']));
}
$db->close();
jsonResponse(['success'=>true,'users'=>$users]);
?>
