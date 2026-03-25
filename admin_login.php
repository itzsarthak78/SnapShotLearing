<?php /* admin_login.php */
require_once '../db_config.php';
$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
if (!$email || !$password) jsonResponse(['success'=>false,'message'=>'Email and password required']);
$db = getDB();
$stmt = $db->prepare("SELECT * FROM admins WHERE email=?");
$stmt->bind_param('s', $email);
$stmt->execute();
$admin = $stmt->get_result()->fetch_assoc();
$db->close();
if (!$admin || !password_verify($password, $admin['password'])) {
    jsonResponse(['success'=>false,'message'=>'Invalid admin credentials']);
}
jsonResponse(['success'=>true,'admin'=>['id'=>$admin['id'],'username'=>$admin['username'],'email'=>$admin['email']]]);
?>
