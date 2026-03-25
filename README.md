# 📸 Snap Shot Learning
### A Mobile-First Course Marketplace — Complete Setup Guide

---

## 🗂 Folder Structure

```
snapshot-learning/
├── index.html              ← Main frontend (open this in browser)
├── style.css               ← All styles (mobile-first, custom CSS)
├── script.js               ← All frontend logic + AJAX calls
├── database.sql            ← MySQL schema (run this first)
│
├── backend/
│   ├── db_config.php       ← DB credentials & shared helpers
│   │
│   ├── api/                ← User-facing API endpoints
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── courses.php
│   │   ├── my_courses.php
│   │   ├── create_course.php
│   │   ├── edit_course.php
│   │   ├── delete_course.php
│   │   ├── add_video.php
│   │   ├── purchase.php
│   │   ├── reviews.php
│   │   ├── help.php
│   │   ├── notifications.php
│   │   ├── banners.php
│   │   ├── broadcast.php
│   │   ├── update_profile.php
│   │   ├── change_password.php
│   │   └── admin_login.php
│   │
│   └── admin/              ← Admin-only API endpoints
│       ├── stats.php
│       ├── all_courses.php
│       ├── pending_courses.php
│       ├── approve_course.php
│       ├── users.php
│       ├── ban_user.php
│       ├── messages.php
│       ├── broadcast.php
│       ├── upload_banner.php
│       ├── delete_banner.php
│       ├── delete_course.php
│       └── banners.php
│
└── uploads/
    ├── thumbnails/         ← Course thumbnail images
    ├── videos/             ← Course video files
    └── banners/            ← Homepage banners
```

---

## ⚙️ Server Requirements

| Requirement | Version |
|---|---|
| PHP | 7.4+ (8.x recommended) |
| MySQL | 5.7+ or MariaDB 10+ |
| Web Server | Apache (with mod_rewrite) or Nginx |
| PHP Extensions | mysqli, fileinfo, json |

---

## 🚀 Setup Steps

### Step 1 — Database Setup
```sql
-- Open phpMyAdmin or MySQL CLI and run:
source /path/to/snapshot-learning/database.sql
```
Or copy-paste the contents of `database.sql` into phpMyAdmin's SQL tab.

### Step 2 — Configure Database Credentials
Edit `backend/db_config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_mysql_username');
define('DB_PASS', 'your_mysql_password');
define('DB_NAME', 'snapshot_learning');
```

### Step 3 — Set Up Razorpay (Payment Gateway)
1. Create account at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Copy your **Test Key ID**
4. In `script.js`, replace:
   ```javascript
   key: 'rzp_test_YOUR_KEY_HERE',
   ```
   With your actual key.

### Step 4 — Configure Uploads Directory
Ensure the `uploads/` folder and its subfolders have write permissions:
```bash
chmod -R 755 uploads/
# or on shared hosting:
chmod -R 777 uploads/
```

### Step 5 — Place on Web Server
- **XAMPP/WAMP**: Place folder in `htdocs/` → access at `http://localhost/snapshot-learning/`
- **Live Server**: Upload via FTP/cPanel to `public_html/`

### Step 6 — Open the App
Visit `http://your-domain/snapshot-learning/index.html` in your browser.

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@snapshot.com | admin123 |
| Demo User | any email | any 6+ char password |

> **⚠️ Change the admin password immediately after first login in production!**

---

## 💡 Demo Mode (No Backend)
The app works **without a backend** in demo mode. All features are simulated with local storage and sample data. Perfect for UI testing without a server.

To use demo mode: simply open `index.html` directly in a browser (file:// protocol). Login with any email/password.

---

## 🎨 Features at a Glance

### User Features
- ✅ Register / Login with email & password
- ✅ Browse courses with search & category filter
- ✅ Course detail page with full info
- ✅ Buy courses via Razorpay
- ✅ Enroll in free courses
- ✅ Video player with speed control (0.5x–2x)
- ✅ Playlist-style course content viewer
- ✅ Leave reviews & ratings after purchase
- ✅ Sell courses (become a seller)
- ✅ Upload multiple videos to courses
- ✅ Edit / delete own courses
- ✅ View purchased & created courses
- ✅ Receive notifications (approval, broadcast)
- ✅ Edit profile & change password
- ✅ Help/support message system
- ✅ View Terms & Conditions

### Admin Features
- ✅ Secure admin login
- ✅ Dashboard with real-time stats
- ✅ Approve / reject course submissions
- ✅ View & delete all courses
- ✅ User management (view, ban)
- ✅ Read all help messages
- ✅ Send broadcast messages (all users or specific)
- ✅ Upload and manage homepage banners
- ✅ Activity feed

---

## 🔒 Security Notes

- All passwords stored as **bcrypt hashes** (never plain text)
- SQL queries use **prepared statements** (prevents SQL injection)
- File uploads are **type-validated** server-side
- Admin endpoints require **admin session verification**
- User endpoints require **authenticated user session**

---

## 📱 Browser Compatibility

Tested on:
- ✅ Chrome / Chromium (Android & Desktop)
- ✅ Safari (iOS & macOS)
- ✅ Firefox
- ✅ Samsung Internet
- ✅ Edge

---

## 🛒 Payment Integration Notes

The app uses **Razorpay** for payments. In test mode:
- Use card number: `4111 1111 1111 1111`
- Any future expiry, any CVV
- OTP: `1234`

For production, switch from test keys to live keys in `script.js`.

---

## 📞 Support

Built with ❤️ using HTML + CSS + JavaScript (Frontend) and PHP + MySQL (Backend).
