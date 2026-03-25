<?php
/* =========================================
   SNAP SHOT LEARNING — db_config.php
   Database Connection Configuration
   ========================================= */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');        // Change to your MySQL password
define('DB_NAME', 'snapshot_learning');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-User-Id, X-Session');
    echo json_encode($data);
    exit;
}

function getAuthUser() {
    $userId = $_SERVER['HTTP_X_USER_ID'] ?? null;
    if (!$userId) return null;
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND is_banned = 0");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $db->close();
    return $result;
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    return $user;
}

function requireAdmin() {
    // Check admin session
    $adminId = $_SERVER['HTTP_X_USER_ID'] ?? null;
    if (!$adminId) jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM admins WHERE id = ?");
    $stmt->bind_param('i', $adminId);
    $stmt->execute();
    $admin = $stmt->get_result()->fetch_assoc();
    $db->close();
    if (!$admin) jsonResponse(['success' => false, 'message' => 'Admin access required'], 403);
    return $admin;
}

function uploadFile($file, $dir, $allowedTypes = ['image/jpeg','image/png','image/webp']) {
    if (!isset($file['tmp_name']) || $file['error'] !== 0) return null;
    if (!in_array($file['type'], $allowedTypes)) return null;
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $ext;
    $path = "../../uploads/$dir/$filename";
    if (!is_dir("../../uploads/$dir")) mkdir("../../uploads/$dir", 0755, true);
    if (move_uploaded_file($file['tmp_name'], $path)) {
        return "uploads/$dir/$filename";
    }
    return null;
}

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-User-Id, X-Session');
    exit;
}
?>
