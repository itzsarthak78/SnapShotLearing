<?php
/* register.php */
require_once '../db_config.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$email || !$password) jsonResponse(['success'=>false,'message'=>'All fields required']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['success'=>false,'message'=>'Invalid email']);
if (strlen($password) < 6) jsonResponse(['success'=>false,'message'=>'Password too short']);
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) jsonResponse(['success'=>false,'message'=>'Username: letters, numbers, underscores only']);

$hash = password_hash($password, PASSWORD_BCRYPT);
$db = getDB();

$stmt = $db->prepare("INSERT INTO users (username, email, password) VALUES (?,?,?)");
$stmt->bind_param('sss', $username, $email, $hash);
if (!$stmt->execute()) {
    $err = $db->error;
    $db->close();
    if (strpos($err, 'Duplicate') !== false) jsonResponse(['success'=>false,'message'=>'Email or username already taken']);
    jsonResponse(['success'=>false,'message'=>'Registration failed']);
}
$userId = $db->insert_id;
$db->close();

jsonResponse(['success'=>true,'user'=>['id'=>$userId,'username'=>$username,'email'=>$email,'purchased'=>[],'created'=>[],'reviews'=>0]]);
?>
