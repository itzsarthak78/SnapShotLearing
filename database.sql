-- =========================================
-- SNAP SHOT LEARNING — Database Schema
-- MySQL 5.7+ / MariaDB 10+
-- =========================================

CREATE DATABASE IF NOT EXISTS snapshot_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE snapshot_learning;

-- ---- Users Table ----
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    avatar_url  VARCHAR(500) DEFAULT NULL,
    is_banned   TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login  DATETIME DEFAULT NULL
);

-- ---- Admins Table ----
CREATE TABLE IF NOT EXISTS admins (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default admin: admin@snapshot.com / admin123
INSERT IGNORE INTO admins (username, email, password)
VALUES ('Admin', 'admin@snapshot.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- Note: password hash above is for 'admin123' using bcrypt

-- ---- Courses Table ----
CREATE TABLE IF NOT EXISTS courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    seller_id       INT NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) DEFAULT 0.00,
    category        VARCHAR(50) DEFAULT 'general',
    thumbnail       VARCHAR(500) DEFAULT NULL,
    outcomes        TEXT COMMENT 'Comma-separated learning outcomes',
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    reject_reason   VARCHAR(500) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Course Videos Table ----
CREATE TABLE IF NOT EXISTS course_videos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    course_id   INT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    video_url   VARCHAR(500) NOT NULL,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ---- Purchases Table ----
CREATE TABLE IF NOT EXISTS purchases (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    course_id       INT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_id      VARCHAR(200) DEFAULT NULL COMMENT 'Razorpay payment ID',
    purchased_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_purchase (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ---- Reviews Table ----
CREATE TABLE IF NOT EXISTS reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    course_id   INT NOT NULL,
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ---- Banners Table ----
CREATE TABLE IF NOT EXISTS banners (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) DEFAULT NULL,
    image_url   VARCHAR(500) NOT NULL,
    link_url    VARCHAR(500) DEFAULT NULL,
    is_active   TINYINT(1) DEFAULT 1,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---- Help Messages Table ----
CREATE TABLE IF NOT EXISTS help_messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    subject     VARCHAR(200) DEFAULT NULL,
    message     TEXT NOT NULL,
    is_read     TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Notifications Table ----
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    message     TEXT NOT NULL,
    icon        VARCHAR(50) DEFAULT 'bell',
    is_read     TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Broadcasts Table ----
CREATE TABLE IF NOT EXISTS broadcasts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    target_type ENUM('all','specific') DEFAULT 'all',
    target_user_id INT DEFAULT NULL,
    message     TEXT NOT NULL,
    is_active   TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---- Sessions Table ----
CREATE TABLE IF NOT EXISTS user_sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- USEFUL VIEWS
-- =========================================

-- Course with seller name and stats
CREATE OR REPLACE VIEW courses_full AS
SELECT 
    c.*,
    u.username AS seller_name,
    u.email AS seller_email,
    ROUND(COALESCE(AVG(r.rating), 0), 1) AS rating,
    COUNT(DISTINCT r.id) AS review_count,
    COUNT(DISTINCT v.id) AS video_count,
    COUNT(DISTINCT p.id) AS purchase_count
FROM courses c
JOIN users u ON c.seller_id = u.id
LEFT JOIN reviews r ON r.course_id = c.id
LEFT JOIN course_videos v ON v.course_id = c.id
LEFT JOIN purchases p ON p.course_id = c.id
GROUP BY c.id;

-- =========================================
-- SAMPLE DATA (optional, comment out if not needed)
-- =========================================
-- INSERT INTO users (username, email, password) VALUES
-- ('demo_user', 'demo@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- password: 'password'
