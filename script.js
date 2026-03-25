/* =========================================
   SNAP SHOT LEARNING — SCRIPT.JS
   Full Frontend Logic + AJAX Backend Calls
   ========================================= */

'use strict';

/* ---- State ---- */
const App = {
  user: null,
  isAdmin: false,
  courses: [],
  filteredCourses: [],
  currentCategory: 'all',
  currentCourseId: null,
  currentPlayingCourse: null,
  pendingCourseId: null,
  selectedRating: 0,
  videosToUpload: [],
  notifications: [],
  banners: [],
  bannerIndex: 0,
  API: 'backend/api/',
  ADMIN_API: 'backend/admin/',
};

/* ============================================
   INITIALIZATION
   ============================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Splash → Auth after 3s
  setTimeout(() => {
    document.getElementById('splash-screen').style.display = 'none';
    const saved = localStorage.getItem('ssl_user');
    const savedAdmin = localStorage.getItem('ssl_admin');
    if (savedAdmin) {
      App.isAdmin = true;
      App.user = JSON.parse(savedAdmin);
      showAdminPanel();
    } else if (saved) {
      App.user = JSON.parse(saved);
      showMainApp();
    } else {
      showAuthScreen();
    }
  }, 3000);
});

/* ============================================
   AUTH
   ============================================ */
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  showView('login-view');
}

function showView(viewId) {
  document.querySelectorAll('.auth-card').forEach(c => c.classList.add('hidden'));
  const el = document.getElementById(viewId);
  if (el) { el.classList.remove('hidden'); }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showToast('Please fill all fields', 'error'); return; }

  showLoading(true);
  try {
    const res = await apiPost('login.php', { email, password });
    if (res.success) {
      App.user = res.user;
      localStorage.setItem('ssl_user', JSON.stringify(res.user));
      document.getElementById('auth-screen').classList.add('hidden');
      showMainApp();
      showToast(`Welcome back, ${res.user.username}!`, 'success');
    } else {
      showToast(res.message || 'Invalid credentials', 'error');
    }
  } catch (e) {
    // Demo mode: fake login
    demoLogin(email);
  }
  showLoading(false);
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!username || !email || !password) { showToast('Please fill all fields', 'error'); return; }
  if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  showLoading(true);
  try {
    const res = await apiPost('register.php', { username, email, password });
    if (res.success) {
      App.user = res.user;
      localStorage.setItem('ssl_user', JSON.stringify(res.user));
      document.getElementById('auth-screen').classList.add('hidden');
      showMainApp();
      showToast(`Account created! Welcome, ${username}!`, 'success');
    } else {
      showToast(res.message || 'Registration failed', 'error');
    }
  } catch (e) {
    demoRegister(username, email);
  }
  showLoading(false);
}

async function handleAdminLogin() {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  if (!email || !password) { showToast('Please fill all fields', 'error'); return; }

  showLoading(true);
  try {
    const res = await apiPost('admin_login.php', { email, password }, true);
    if (res.success) {
      App.isAdmin = true;
      App.user = res.admin;
      localStorage.setItem('ssl_admin', JSON.stringify(res.admin));
      document.getElementById('auth-screen').classList.add('hidden');
      showAdminPanel();
    } else {
      showToast(res.message || 'Invalid admin credentials', 'error');
    }
  } catch (e) {
    // Demo admin login
    if (email === 'admin@snapshot.com' && password === 'admin123') {
      App.isAdmin = true;
      App.user = { username: 'Admin', email };
      localStorage.setItem('ssl_admin', JSON.stringify(App.user));
      document.getElementById('auth-screen').classList.add('hidden');
      showAdminPanel();
    } else {
      showToast('Admin: use admin@snapshot.com / admin123', 'info');
    }
  }
  showLoading(false);
}

function handleLogout() {
  localStorage.removeItem('ssl_user');
  App.user = null;
  document.getElementById('main-app').classList.add('hidden');
  showAuthScreen();
  showToast('Signed out successfully');
}

function handleAdminLogout() {
  localStorage.removeItem('ssl_admin');
  App.isAdmin = false;
  App.user = null;
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-panel').style.display = '';
  showAuthScreen();
}

/* Demo mode fallbacks */
function demoLogin(email) {
  const username = email.split('@')[0];
  App.user = { id: 1, username, email, purchased: [], created: [] };
  localStorage.setItem('ssl_user', JSON.stringify(App.user));
  document.getElementById('auth-screen').classList.add('hidden');
  showMainApp();
  showToast(`Welcome back, ${username}! (Demo Mode)`, 'success');
}

function demoRegister(username, email) {
  App.user = { id: Date.now(), username, email, purchased: [], created: [] };
  localStorage.setItem('ssl_user', JSON.stringify(App.user));
  document.getElementById('auth-screen').classList.add('hidden');
  showMainApp();
  showToast(`Account created! Welcome, ${username}! (Demo Mode)`, 'success');
}

/* ============================================
   MAIN APP
   ============================================ */
function showMainApp() {
  document.getElementById('main-app').classList.remove('hidden');
  updateProfile();
  loadCourses();
  loadNotifications();
  checkBroadcast();
  switchTab('home');
}

function switchTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById(`page-${tab}`);
  const navTab = document.getElementById(`tab-${tab}`);
  if (page) page.classList.add('active');
  if (navTab) navTab.classList.add('active');

  if (tab === 'mycourses') loadMyCourses();
  if (tab === 'profile') updateProfile();
}

/* ============================================
   COURSES
   ============================================ */
async function loadCourses() {
  try {
    const res = await apiGet('courses.php');
    App.courses = res.courses || [];
  } catch (e) {
    App.courses = getDemoCourses();
  }
  App.filteredCourses = [...App.courses];
  renderPopularCourses();
  renderAllCourses();
  loadBanners();
}

function renderPopularCourses() {
  const list = document.getElementById('popular-courses-list');
  const popular = App.filteredCourses.filter(c => c.status === 'approved').slice(0, 8);
  if (!popular.length) {
    list.innerHTML = '<p style="color:var(--text3);font-size:14px;padding:12px 0">No courses yet</p>';
    return;
  }
  list.innerHTML = popular.map(c => courseCardH(c)).join('');
}

function renderAllCourses() {
  const list = document.getElementById('all-courses-list');
  const all = App.filteredCourses.filter(c => c.status === 'approved');
  document.getElementById('course-count').textContent = `${all.length} course${all.length !== 1 ? 's' : ''}`;
  if (!all.length) {
    list.innerHTML = '<p style="color:var(--text3);font-size:14px;padding:12px 0;grid-column:span 2">No courses found</p>';
    return;
  }
  list.innerHTML = all.map((c, i) => courseCardV(c, i)).join('');
}

function courseCardH(c) {
  const price = c.price == 0 ? '<span class="card-price free">FREE</span>' : `<span class="card-price">₹${c.price}</span>`;
  const rating = c.rating ? `<div class="card-rating"><i class="fa fa-star"></i>${parseFloat(c.rating).toFixed(1)}</div>` : '';
  const thumb = c.thumbnail ? `<img class="thumb" src="${c.thumbnail}" alt="${c.name}" onerror="this.parentNode.innerHTML='<div class=\\'thumb\\' style=\\'display:flex;align-items:center;justify-content:center\\'><i class=\\'fa fa-book\\' style=\\'font-size:32px;color:var(--text3)\\'></i></div>'" />` : `<div class="thumb" style="display:flex;align-items:center;justify-content:center"><i class="fa fa-book" style="font-size:32px;color:var(--text3)"></i></div>`;
  return `<div class="course-card-h" onclick="openCourseDetail(${c.id})">
    ${thumb}
    <div class="card-body">
      <div class="card-title">${escHtml(c.name)}</div>
      <div class="card-seller">by ${escHtml(c.seller_name || c.seller)}</div>
      ${rating}
      ${price}
    </div>
  </div>`;
}

function courseCardV(c, i = 0) {
  const price = c.price == 0 ? '<span class="card-price free">FREE</span>' : `<span class="card-price">₹${c.price}</span>`;
  const rating = c.rating ? `<div class="card-rating"><i class="fa fa-star"></i>${parseFloat(c.rating).toFixed(1)}</div>` : '';
  const thumb = c.thumbnail
    ? `<img class="thumb" src="${c.thumbnail}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="thumb" style="display:none;align-items:center;justify-content:center"><i class="fa fa-book thumb-placeholder"></i></div>`
    : `<div class="thumb" style="display:flex;align-items:center;justify-content:center"><i class="fa fa-book thumb-placeholder"></i></div>`;
  return `<div class="course-card-v" onclick="openCourseDetail(${c.id})" style="animation-delay:${i * 0.06}s">
    ${thumb}
    <div class="card-body">
      <div class="card-title">${escHtml(c.name)}</div>
      <div class="card-seller">by ${escHtml(c.seller_name || c.seller)}</div>
      ${rating}
      ${price}
    </div>
  </div>`;
}

function filterCourses(q) {
  if (!q) {
    App.filteredCourses = filterByCurrentCategory(App.courses);
  } else {
    App.filteredCourses = App.courses.filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.seller_name || c.seller || '').toLowerCase().includes(q.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(q.toLowerCase())
    );
  }
  renderPopularCourses();
  renderAllCourses();
}

function filterByCategory(cat, btn) {
  App.currentCategory = cat;
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  App.filteredCourses = filterByCurrentCategory(App.courses);
  renderPopularCourses();
  renderAllCourses();
}

function filterByCurrentCategory(list) {
  if (App.currentCategory === 'all') return list;
  return list.filter(c => (c.category || '').toLowerCase() === App.currentCategory);
}

/* ============================================
   COURSE DETAIL
   ============================================ */
async function openCourseDetail(courseId) {
  App.currentCourseId = courseId;
  const course = App.courses.find(c => c.id == courseId);
  if (!course) return;

  const hasPurchased = isPurchased(courseId);
  const priceLabel = course.price == 0 ? 'FREE' : `₹${course.price}`;
  const priceClass = course.price == 0 ? 'free' : '';
  const outcomes = course.outcomes ? course.outcomes.split(',').map(o => o.trim()).filter(Boolean) : [];
  const outcomesHtml = outcomes.length ? `<ul class="outcomes-list">${outcomes.map(o => `<li><i class="fa fa-check-circle"></i>${escHtml(o)}</li>`).join('')}</ul>` : '';
  const ratingHtml = course.rating ? `<span><i class="fa fa-star" style="color:var(--accent)"></i> ${parseFloat(course.rating).toFixed(1)} (${course.review_count || 0} reviews)</span>` : '';
  const thumbHtml = course.thumbnail
    ? `<img src="${course.thumbnail}" alt="${escHtml(course.name)}" style="width:100%;height:200px;object-fit:cover;border-radius:var(--radius-sm)" />`
    : `<div class="hero-placeholder"><i class="fa fa-graduation-cap"></i></div>`;
  const actionBtn = hasPurchased
    ? `<div class="already-bought-btn"><i class="fa fa-check-circle"></i> Already Purchased</div><button class="btn-primary" onclick="openPlayer(${courseId}); closeModal('course-detail-modal')" style="margin-top:8px;background:linear-gradient(135deg,var(--primary),var(--primary-dark))"><i class="fa fa-play"></i> Continue Learning</button>`
    : course.price == 0
    ? `<button class="buy-btn" onclick="enrollFree(${courseId})"><i class="fa fa-check"></i> Enroll Free</button>`
    : `<button class="buy-btn" onclick="initPayment(${courseId})"><i class="fa fa-lock-open"></i> Buy Now – ₹${course.price}</button>`;

  document.getElementById('course-detail-content').innerHTML = `
    ${thumbHtml}
    <h2 class="course-detail-title">${escHtml(course.name)}</h2>
    <div class="course-detail-meta">
      <span><i class="fa fa-user"></i> ${escHtml(course.seller_name || course.seller)}</span>
      ${ratingHtml}
      <span><i class="fa fa-tag"></i> ${escHtml(course.category || 'General')}</span>
      <span><i class="fa fa-video"></i> ${course.video_count || 0} videos</span>
    </div>
    <div class="${priceClass} course-price-big">${priceLabel}</div>
    <p class="course-detail-desc">${escHtml(course.description || 'No description provided.')}</p>
    ${outcomesHtml}
    ${actionBtn}
  `;
  openModal('course-detail-modal');
}

/* ============================================
   PAYMENT
   ============================================ */
function initPayment(courseId) {
  const course = App.courses.find(c => c.id == courseId);
  if (!course) return;

  // Razorpay integration
  const options = {
    key: 'rzp_test_YOUR_KEY_HERE', // Replace with actual key
    amount: Math.round(course.price * 100),
    currency: 'INR',
    name: 'Snap Shot Learning',
    description: course.name,
    image: 'assets/icons/logo.png',
    handler: async function (response) {
      showLoading(true);
      try {
        const res = await apiPost('purchase.php', {
          course_id: courseId,
          payment_id: response.razorpay_payment_id,
          amount: course.price,
        });
        if (res.success) {
          recordPurchase(courseId);
          closeModal('course-detail-modal');
          showToast('Payment successful! Course unlocked 🎉', 'success');
          setTimeout(() => openPlayer(courseId), 800);
        }
      } catch (e) {
        // Demo: assume success
        recordPurchase(courseId);
        closeModal('course-detail-modal');
        showToast('Payment successful! Course unlocked 🎉', 'success');
        setTimeout(() => openPlayer(courseId), 800);
      }
      showLoading(false);
    },
    prefill: { name: App.user.username, email: App.user.email },
    theme: { color: '#4F46E5' },
    modal: { ondismiss: () => showToast('Payment cancelled', 'info') },
  };

  try {
    const rzp = new Razorpay(options);
    rzp.open();
  } catch (e) {
    // Razorpay not loaded, simulate for demo
    if (confirm(`Demo: Simulate payment of ₹${course.price} for "${course.name}"?`)) {
      recordPurchase(courseId);
      closeModal('course-detail-modal');
      showToast('Payment successful! Course unlocked 🎉', 'success');
      setTimeout(() => openPlayer(courseId), 800);
    }
  }
}

function enrollFree(courseId) {
  recordPurchase(courseId);
  closeModal('course-detail-modal');
  showToast('Enrolled successfully!', 'success');
  setTimeout(() => openPlayer(courseId), 600);
}

function recordPurchase(courseId) {
  if (!App.user.purchased) App.user.purchased = [];
  if (!App.user.purchased.includes(courseId)) {
    App.user.purchased.push(courseId);
    localStorage.setItem('ssl_user', JSON.stringify(App.user));
  }
  apiPost('purchase.php', { course_id: courseId }).catch(() => {});
}

function isPurchased(courseId) {
  return App.user && App.user.purchased && App.user.purchased.includes(courseId);
}

/* ============================================
   COURSE PLAYER
   ============================================ */
function openPlayer(courseId) {
  const course = App.courses.find(c => c.id == courseId);
  if (!course) return;
  App.currentPlayingCourse = course;

  document.getElementById('player-course-title').textContent = course.name;
  const videos = course.videos || getDemoVideos(course.name);

  // Build playlist
  const playlist = document.getElementById('video-playlist');
  playlist.innerHTML = videos.map((v, i) => `
    <div class="video-item ${i === 0 ? 'active' : ''}" onclick="playVideo('${v.url || ''}', '${escHtml(v.title)}', this)">
      <i class="fa fa-${i === 0 ? 'play-circle' : 'circle-play'}"></i>
      <span>${escHtml(v.title)}</span>
    </div>
  `).join('');

  // Load first video
  if (videos.length) playVideo(videos[0].url || '', videos[0].title, playlist.firstElementChild);

  // Load reviews
  loadReviews(courseId);

  openModal('course-player-modal');
}

function playVideo(url, title, el) {
  const video = document.getElementById('main-video');
  if (url) { video.src = url; video.play().catch(() => {}); }
  document.querySelectorAll('.video-item').forEach(v => { v.classList.remove('active'); v.querySelector('i').className = 'fa fa-circle-play'; });
  if (el) { el.classList.add('active'); el.querySelector('i').className = 'fa fa-play-circle'; }
  document.getElementById('player-course-title').textContent = title;
}

function setSpeed(s) {
  document.getElementById('main-video').playbackRate = s;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function togglePlaylist() {
  const p = document.getElementById('playlist-panel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

/* ============================================
   REVIEWS
   ============================================ */
async function loadReviews(courseId) {
  try {
    const res = await apiGet(`reviews.php?course_id=${courseId}`);
    renderReviews(res.reviews || []);
  } catch (e) {
    renderReviews(getDemoReviews());
  }
}

function renderReviews(reviews) {
  const list = document.getElementById('reviews-list');
  if (!reviews.length) { list.innerHTML = '<p style="color:var(--text3);font-size:14px">No reviews yet. Be the first!</p>'; return; }
  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${r.username ? r.username[0].toUpperCase() : 'U'}</div>
        <div>
          <div class="reviewer-name">${escHtml(r.username || 'Anonymous')}</div>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
      </div>
      <p class="review-text">${escHtml(r.review || '')}</p>
    </div>
  `).join('');
}

function setRating(n) {
  App.selectedRating = n;
  document.querySelectorAll('#star-input i').forEach((s, i) => {
    s.classList.toggle('active', i < n);
  });
}

async function submitReview() {
  if (!App.selectedRating) { showToast('Please select a rating', 'error'); return; }
  const text = document.getElementById('review-text').value.trim();
  if (!text) { showToast('Please write a review', 'error'); return; }
  if (!App.currentPlayingCourse) return;

  showLoading(true);
  try {
    const res = await apiPost('reviews.php', {
      course_id: App.currentPlayingCourse.id,
      rating: App.selectedRating,
      review: text,
    });
    if (res.success) {
      document.getElementById('review-text').value = '';
      setRating(0);
      loadReviews(App.currentPlayingCourse.id);
      showToast('Review submitted!', 'success');
    }
  } catch (e) {
    // Demo
    document.getElementById('review-text').value = '';
    setRating(0);
    showToast('Review submitted! (Demo)', 'success');
  }
  showLoading(false);
}

/* ============================================
   MY COURSES
   ============================================ */
function loadMyCourses() {
  loadPurchasedCourses();
  loadCreatedCourses();
}

function loadPurchasedCourses() {
  const list = document.getElementById('purchased-courses-list');
  const empty = document.getElementById('purchased-empty');
  const purchased = App.courses.filter(c => isPurchased(c.id));
  if (!purchased.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = purchased.map(c => `
    <div class="my-course-card" onclick="openPlayer(${c.id})">
      <div class="thumb">${c.thumbnail ? `<img src="${c.thumbnail}" />` : '<i class="fa fa-book" style="font-size:24px;color:var(--text3)"></i>'}</div>
      <div class="card-info">
        <div class="card-title">${escHtml(c.name)}</div>
        <div class="card-meta">by ${escHtml(c.seller_name || c.seller)} · ${c.video_count || 0} videos</div>
        <div class="card-actions">
          <button class="btn-primary" style="width:auto;padding:6px 14px;font-size:12px" onclick="event.stopPropagation();openPlayer(${c.id})"><i class="fa fa-play"></i> Continue</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadCreatedCourses() {
  const list = document.getElementById('created-courses-list');
  const empty = document.getElementById('created-empty');
  let created = [];

  try {
    const res = await apiGet('my_courses.php');
    created = res.courses || [];
  } catch (e) {
    created = App.user.created ? App.courses.filter(c => App.user.created.includes(c.id)) : [];
  }

  if (!created.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = created.map(c => {
    const statusBadge = `<span class="status-badge ${c.status}">${c.status === 'approved' ? '✓ Approved' : c.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}</span>`;
    return `<div class="my-course-card">
      <div class="thumb">${c.thumbnail ? `<img src="${c.thumbnail}" />` : '<i class="fa fa-book" style="font-size:24px;color:var(--text3)"></i>'}</div>
      <div class="card-info">
        <div class="card-title">${escHtml(c.name)}</div>
        <div class="card-meta">₹${c.price} · ${c.video_count || 0} videos</div>
        <div class="card-actions">
          ${statusBadge}
          <button class="btn-primary" style="width:auto;padding:5px 12px;font-size:11px;background:var(--bg2);color:var(--text);box-shadow:none" onclick="openEditCourse(${c.id})"><i class="fa fa-edit"></i></button>
          <button class="btn-danger" style="font-size:11px;padding:5px 10px" onclick="deleteCourse(${c.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function switchInnerTab(tab, btn) {
  document.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.inner-tab-content').forEach(c => c.classList.add('hidden'));
  btn.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

/* ============================================
   PROFILE
   ============================================ */
function updateProfile() {
  if (!App.user) return;
  const letter = App.user.username ? App.user.username[0].toUpperCase() : 'U';
  document.getElementById('profile-avatar-letter').textContent = letter;
  document.getElementById('profile-username-display').textContent = App.user.username || 'User';
  document.getElementById('profile-email-display').textContent = App.user.email || '';

  const purchased = App.user.purchased ? App.user.purchased.length : 0;
  document.getElementById('stat-purchased').textContent = purchased;
  document.getElementById('stat-created').textContent = App.user.created ? App.user.created.length : 0;
  document.getElementById('stat-reviews').textContent = App.user.reviews || 0;
}

function openEditProfile() {
  const name = prompt('Enter new username:', App.user.username);
  if (name && name.trim()) {
    App.user.username = name.trim();
    localStorage.setItem('ssl_user', JSON.stringify(App.user));
    updateProfile();
    showToast('Profile updated!', 'success');
    apiPost('update_profile.php', { username: name.trim() }).catch(() => {});
  }
}

function openChangePassword() {
  const np = prompt('Enter new password (min 6 chars):');
  if (np && np.length >= 6) {
    showToast('Password updated!', 'success');
    apiPost('change_password.php', { password: np }).catch(() => {});
  } else if (np) {
    showToast('Password too short', 'error');
  }
}

/* ============================================
   COURSE CREATION (SELLER)
   ============================================ */
function openCourseCreation() {
  App.videosToUpload = [];
  document.getElementById('course-name').value = '';
  document.getElementById('course-price').value = '';
  document.getElementById('course-desc').value = '';
  document.getElementById('course-outcomes').value = '';
  document.getElementById('thumb-preview').classList.add('hidden');
  document.getElementById('thumb-placeholder').style.display = 'flex';
  openModal('course-create-modal');
}

function previewThumb(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('thumb-preview');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    document.getElementById('thumb-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

async function submitCourse() {
  const name = document.getElementById('course-name').value.trim();
  const price = document.getElementById('course-price').value;
  const desc = document.getElementById('course-desc').value.trim();
  const category = document.getElementById('course-category').value;
  const outcomes = document.getElementById('course-outcomes').value.trim();
  const thumbFile = document.getElementById('thumb-input').files[0];

  if (!name || !desc) { showToast('Please fill all required fields', 'error'); return; }
  if (price === '') { showToast('Please enter a price', 'error'); return; }

  showLoading(true);
  try {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('price', price);
    fd.append('description', desc);
    fd.append('category', category);
    fd.append('outcomes', outcomes);
    if (thumbFile) fd.append('thumbnail', thumbFile);

    const res = await apiFormPost('create_course.php', fd);
    if (res.success) {
      App.pendingCourseId = res.course_id;
      closeModal('course-create-modal');
      document.getElementById('fab-btn').classList.remove('hidden');
      showToast('Course submitted for review! Add videos now.', 'success');
      if (!App.user.created) App.user.created = [];
      App.user.created.push(res.course_id);
      localStorage.setItem('ssl_user', JSON.stringify(App.user));
    } else {
      showToast(res.message || 'Submission failed', 'error');
    }
  } catch (e) {
    // Demo mode
    App.pendingCourseId = Date.now();
    closeModal('course-create-modal');
    document.getElementById('fab-btn').classList.remove('hidden');
    showToast('Course submitted for review! (Demo) Add videos now.', 'success');
  }
  showLoading(false);
}

function openAddVideo() {
  App.videosToUpload = [];
  document.getElementById('video-list-preview').innerHTML = '';
  document.getElementById('video-title').value = '';
  document.getElementById('video-selected').classList.add('hidden');
  document.getElementById('video-placeholder').classList.remove('hidden');
  openModal('add-video-modal');
}

function selectVideo(input) {
  if (!input.files[0]) return;
  document.getElementById('video-filename').textContent = input.files[0].name;
  document.getElementById('video-selected').classList.remove('hidden');
  document.getElementById('video-placeholder').classList.add('hidden');
}

function addVideo() {
  const title = document.getElementById('video-title').value.trim();
  const file = document.getElementById('video-input').files[0];
  if (!title) { showToast('Enter a video title', 'error'); return; }
  if (!file) { showToast('Select a video file', 'error'); return; }

  App.videosToUpload.push({ title, file });
  const preview = document.getElementById('video-list-preview');
  const idx = App.videosToUpload.length - 1;
  const item = document.createElement('div');
  item.className = 'video-preview-item';
  item.innerHTML = `<i class="fa fa-film"></i><span>${escHtml(title)}</span><button onclick="removeVideo(${idx}, this.parentNode)"><i class="fa fa-times"></i></button>`;
  preview.appendChild(item);

  document.getElementById('video-title').value = '';
  document.getElementById('video-input').value = '';
  document.getElementById('video-selected').classList.add('hidden');
  document.getElementById('video-placeholder').classList.remove('hidden');
  showToast('Video added to queue', 'success');
}

function removeVideo(idx, el) {
  App.videosToUpload.splice(idx, 1);
  el.remove();
}

async function finishCourseUpload() {
  if (!App.videosToUpload.length) { showToast('Add at least one video', 'error'); return; }
  showLoading(true);

  try {
    for (const v of App.videosToUpload) {
      const fd = new FormData();
      fd.append('course_id', App.pendingCourseId);
      fd.append('title', v.title);
      fd.append('video', v.file);
      await apiFormPost('add_video.php', fd);
    }
    closeModal('add-video-modal');
    document.getElementById('fab-btn').classList.add('hidden');
    showToast(`${App.videosToUpload.length} video(s) uploaded! Course pending approval.`, 'success');
    App.videosToUpload = [];
    App.pendingCourseId = null;
    loadCourses();
    switchTab('mycourses');
  } catch (e) {
    closeModal('add-video-modal');
    document.getElementById('fab-btn').classList.add('hidden');
    showToast('Videos uploaded! (Demo) Course pending approval.', 'success');
    App.videosToUpload = [];
  }
  showLoading(false);
}

/* ---- Edit Course ---- */
function openEditCourse(courseId) {
  const course = App.courses.find(c => c.id == courseId);
  if (!course) return;
  document.getElementById('edit-course-id').value = courseId;
  document.getElementById('edit-course-name').value = course.name;
  document.getElementById('edit-course-price').value = course.price;
  document.getElementById('edit-course-desc').value = course.description || '';
  openModal('edit-course-modal');
}

function previewEditThumb(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('edit-thumb-preview').src = e.target.result;
    document.getElementById('edit-thumb-preview').classList.remove('hidden');
    document.getElementById('edit-thumb-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

async function saveEditCourse() {
  const id = document.getElementById('edit-course-id').value;
  const name = document.getElementById('edit-course-name').value.trim();
  const price = document.getElementById('edit-course-price').value;
  const desc = document.getElementById('edit-course-desc').value.trim();
  const thumbFile = document.getElementById('edit-thumb-input').files[0];

  showLoading(true);
  try {
    const fd = new FormData();
    fd.append('course_id', id);
    fd.append('name', name);
    fd.append('price', price);
    fd.append('description', desc);
    if (thumbFile) fd.append('thumbnail', thumbFile);
    const res = await apiFormPost('edit_course.php', fd);
    if (res.success) {
      showToast('Course updated!', 'success');
      closeModal('edit-course-modal');
      loadCourses();
      loadCreatedCourses();
    }
  } catch (e) {
    showToast('Course updated! (Demo)', 'success');
    closeModal('edit-course-modal');
  }
  showLoading(false);
}

async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) return;
  showLoading(true);
  try {
    const res = await apiPost('delete_course.php', { course_id: courseId });
    if (res.success) {
      showToast('Course deleted', 'success');
      loadCourses(); loadCreatedCourses();
    }
  } catch (e) {
    showToast('Course deleted (Demo)', 'success');
    App.courses = App.courses.filter(c => c.id != courseId);
    loadCreatedCourses();
  }
  showLoading(false);
}

/* ============================================
   HELP
   ============================================ */
async function submitHelpMessage() {
  const subject = document.getElementById('help-subject').value.trim();
  const message = document.getElementById('help-message').value.trim();
  if (!message) { showToast('Please write a message', 'error'); return; }

  showLoading(true);
  try {
    const res = await apiPost('help.php', { subject, message });
    if (res.success) {
      document.getElementById('help-subject').value = '';
      document.getElementById('help-message').value = '';
      showToast('Message sent! We\'ll respond within 24 hours.', 'success');
    }
  } catch (e) {
    document.getElementById('help-subject').value = '';
    document.getElementById('help-message').value = '';
    showToast('Message sent! (Demo)', 'success');
  }
  showLoading(false);
}

function toggleFaq(item) {
  item.classList.toggle('open');
}

/* ============================================
   BANNERS
   ============================================ */
async function loadBanners() {
  try {
    const res = await apiGet('banners.php');
    App.banners = res.banners || [];
  } catch (e) {
    App.banners = [];
  }
  renderBanners();
}

function renderBanners() {
  const section = document.getElementById('banner-section');
  if (!App.banners.length) return; // Keep default banner
  const slidesHtml = App.banners.map((b, i) => `
    <div class="banner-slide ${i === 0 ? 'active' : ''}">
      <img class="banner-img-slide" src="${b.image_url}" alt="${escHtml(b.title || 'Banner')}" />
    </div>
  `).join('');
  const dotsHtml = App.banners.map((_, i) => `<div class="banner-dot ${i === 0 ? 'active' : ''}" onclick="goToBanner(${i})"></div>`).join('');
  section.innerHTML = slidesHtml + `<div class="banner-dots" id="banner-dots">${dotsHtml}</div>`;
  if (App.banners.length > 1) startBannerRotation();
}

function startBannerRotation() {
  setInterval(() => {
    goToBanner((App.bannerIndex + 1) % App.banners.length);
  }, 4000);
}

function goToBanner(idx) {
  App.bannerIndex = idx;
  document.querySelectorAll('.banner-slide').forEach((s, i) => s.classList.toggle('active', i === idx));
  document.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

/* ============================================
   NOTIFICATIONS
   ============================================ */
async function loadNotifications() {
  try {
    const res = await apiGet('notifications.php');
    App.notifications = res.notifications || [];
    if (App.notifications.length) document.getElementById('notif-dot').classList.remove('hidden');
  } catch (e) { App.notifications = []; }
}

function showNotifications() {
  const popup = document.getElementById('notif-popup');
  popup.classList.toggle('hidden');
  document.getElementById('notif-dot').classList.add('hidden');
  const list = document.getElementById('notif-list');
  if (!App.notifications.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:14px">No notifications</div>';
    return;
  }
  list.innerHTML = App.notifications.map(n => `
    <div class="notif-item">
      <i class="fa fa-${n.icon || 'bell'}"></i>
      <div><p>${escHtml(n.message)}</p><div class="notif-time">${n.time || 'Just now'}</div></div>
    </div>
  `).join('');
}

function closeNotif() {
  document.getElementById('notif-popup').classList.add('hidden');
}

async function checkBroadcast() {
  try {
    const res = await apiGet('broadcast.php');
    if (res.message) showBroadcast(res.message);
  } catch (e) {}
}

function showBroadcast(msg) {
  document.getElementById('broadcast-text').textContent = msg;
  document.getElementById('broadcast-popup').classList.remove('hidden');
  setTimeout(closeBroadcast, 8000);
}

function closeBroadcast() {
  document.getElementById('broadcast-popup').classList.add('hidden');
}

function openSearch() {
  document.getElementById('home-search').focus();
  switchTab('home');
}

/* ============================================
   ADMIN PANEL
   ============================================ */
function showAdminPanel() {
  const panel = document.getElementById('admin-panel');
  panel.classList.remove('hidden');
  panel.style.display = 'flex';
  adminSwitchTab('dashboard');
  loadAdminData();
}

function adminSwitchTab(tab, btn) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(`admin-${tab}`);
  if (page) page.classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelector(`.admin-nav-item[onclick*="${tab}"]`)?.classList.add('active');
  document.getElementById('admin-page-title').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);

  // Close sidebar on mobile after tab switch
  if (window.innerWidth < 768) document.getElementById('admin-sidebar').classList.remove('open');
}

function toggleAdminSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}

async function loadAdminData() {
  try {
    const res = await apiGet('stats.php', true);
    if (res.stats) {
      document.getElementById('stat-total-users').textContent = res.stats.users || 0;
      document.getElementById('stat-total-courses').textContent = res.stats.courses || 0;
      document.getElementById('stat-pending').textContent = res.stats.pending || 0;
      document.getElementById('stat-messages').textContent = res.stats.messages || 0;
      updateBadge('approval-badge', res.stats.pending);
      updateBadge('msg-badge', res.stats.messages);
    }
    renderActivity(res.activity || []);
  } catch (e) {
    // Demo stats
    document.getElementById('stat-total-users').textContent = '12';
    document.getElementById('stat-total-courses').textContent = '8';
    document.getElementById('stat-pending').textContent = '3';
    document.getElementById('stat-messages').textContent = '5';
    updateBadge('approval-badge', 3);
    updateBadge('msg-badge', 5);
    renderActivity(getDemoActivity());
  }
  loadAdminCourses();
  loadAdminApprovals();
  loadAdminUsers();
  loadAdminMessages();
}

function updateBadge(id, count) {
  const el = document.getElementById(id);
  if (el) { el.textContent = count > 0 ? count : ''; }
}

function renderActivity(items) {
  const list = document.getElementById('recent-activity-list');
  list.innerHTML = items.map(a => `
    <div class="activity-item"><i class="fa fa-${a.icon || 'circle'}"></i><span>${escHtml(a.text)}</span><span class="activity-time">${a.time || ''}</span></div>
  `).join('');
}

async function loadAdminCourses() {
  try {
    const res = await apiGet('all_courses.php', true);
    renderAdminCourses(res.courses || []);
  } catch (e) {
    renderAdminCourses(getDemoCourses());
  }
}

function renderAdminCourses(courses) {
  const list = document.getElementById('admin-courses-list');
  if (!courses.length) { list.innerHTML = '<p style="color:#64748B">No courses yet</p>'; return; }
  list.innerHTML = courses.map(c => `
    <div class="admin-course-row">
      <img class="admin-course-thumb" src="${c.thumbnail || ''}" onerror="this.style.display='none'" />
      <div class="admin-course-info">
        <h4>${escHtml(c.name)}</h4>
        <p>by ${escHtml(c.seller_name || c.seller)} · ₹${c.price} · <span class="status-badge ${c.status}" style="display:inline-flex;padding:2px 8px">${c.status}</span></p>
      </div>
      <div class="admin-course-actions">
        <button class="btn-success" style="font-size:12px;padding:6px 10px" onclick="adminViewCourse(${c.id})"><i class="fa fa-eye"></i></button>
        <button class="btn-danger" style="font-size:12px;padding:6px 10px" onclick="adminDeleteCourse(${c.id})"><i class="fa fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function adminSearchCourses(q) {
  const rows = document.querySelectorAll('#admin-courses-list .admin-course-row');
  rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
}

async function adminDeleteCourse(id) {
  if (!confirm('Delete this course?')) return;
  showLoading(true);
  try {
    await apiPost('delete_course.php', { course_id: id }, true);
    showToast('Course deleted', 'success');
    loadAdminCourses();
  } catch (e) { showToast('Deleted (Demo)', 'success'); }
  showLoading(false);
}

function adminViewCourse(id) {
  const course = getDemoCourses().find(c => c.id == id) || App.courses.find(c => c.id == id);
  if (course) alert(`Course: ${course.name}\nSeller: ${course.seller_name || course.seller}\nVideos: ${course.video_count || 0}\nStatus: ${course.status}`);
}

async function loadAdminApprovals() {
  try {
    const res = await apiGet('pending_courses.php', true);
    renderApprovals(res.courses || []);
  } catch (e) {
    renderApprovals(getDemoCourses().filter(c => c.status === 'pending'));
  }
}

function renderApprovals(courses) {
  const list = document.getElementById('admin-approvals-list');
  updateBadge('approval-badge', courses.length);
  if (!courses.length) { list.innerHTML = '<p style="color:#64748B;text-align:center;padding:40px">No pending approvals 🎉</p>'; return; }
  list.innerHTML = courses.map(c => `
    <div class="approval-card" id="approval-${c.id}">
      <div class="approval-header">
        <img class="approval-thumb" src="${c.thumbnail || ''}" onerror="this.style.display='none'" />
        <div class="approval-info">
          <h4>${escHtml(c.name)}</h4>
          <p>by ${escHtml(c.seller_name || c.seller)} · ₹${c.price} · ${c.category || 'General'}</p>
        </div>
      </div>
      <p class="approval-desc">${escHtml(c.description || 'No description.')}</p>
      <div class="approval-actions">
        <button class="btn-success" onclick="approveCourse(${c.id})"><i class="fa fa-check"></i> Approve</button>
        <button class="btn-danger" onclick="rejectCourse(${c.id})"><i class="fa fa-times"></i> Reject</button>
      </div>
    </div>
  `).join('');
}

async function approveCourse(id) {
  showLoading(true);
  try {
    await apiPost('approve_course.php', { course_id: id, status: 'approved' }, true);
    showToast('Course approved!', 'success');
  } catch (e) { showToast('Approved (Demo)', 'success'); }
  document.getElementById(`approval-${id}`)?.remove();
  loadAdminData();
  showLoading(false);
}

async function rejectCourse(id) {
  const reason = prompt('Reason for rejection (optional):');
  showLoading(true);
  try {
    await apiPost('approve_course.php', { course_id: id, status: 'rejected', reason }, true);
    showToast('Course rejected', 'info');
  } catch (e) { showToast('Rejected (Demo)', 'info'); }
  document.getElementById(`approval-${id}`)?.remove();
  loadAdminData();
  showLoading(false);
}

async function loadAdminUsers() {
  try {
    const res = await apiGet('users.php', true);
    renderAdminUsers(res.users || []);
  } catch (e) {
    renderAdminUsers(getDemoUsers());
  }
}

function renderAdminUsers(users) {
  const list = document.getElementById('admin-users-list');
  list.innerHTML = users.map(u => `
    <div class="admin-user-row">
      <div class="admin-user-avatar">${u.username ? u.username[0].toUpperCase() : 'U'}</div>
      <div class="admin-user-info">
        <h4>${escHtml(u.username)}</h4>
        <p>${escHtml(u.email)} · Joined ${u.joined || 'recently'}</p>
      </div>
      <div class="admin-user-actions">
        <button class="btn-danger" style="font-size:12px;padding:6px 10px" onclick="banUser(${u.id}, '${escHtml(u.username)}')"><i class="fa fa-ban"></i> Ban</button>
      </div>
    </div>
  `).join('');
}

function adminSearchUsers(q) {
  const rows = document.querySelectorAll('#admin-users-list .admin-user-row');
  rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
}

async function banUser(id, name) {
  if (!confirm(`Ban user "${name}"?`)) return;
  showLoading(true);
  try {
    await apiPost('ban_user.php', { user_id: id }, true);
    showToast(`User "${name}" banned`, 'success');
    loadAdminUsers();
  } catch (e) { showToast(`User banned (Demo)`, 'info'); }
  showLoading(false);
}

async function loadAdminMessages() {
  try {
    const res = await apiGet('messages.php', true);
    renderAdminMessages(res.messages || []);
  } catch (e) {
    renderAdminMessages(getDemoMessages());
  }
}

function renderAdminMessages(messages) {
  const list = document.getElementById('admin-messages-list');
  updateBadge('msg-badge', messages.length);
  if (!messages.length) { list.innerHTML = '<p style="color:#64748B;text-align:center;padding:40px">No messages yet</p>'; return; }
  list.innerHTML = messages.map(m => `
    <div class="message-card">
      <div class="msg-header">
        <span class="msg-from">${escHtml(m.username || 'Unknown User')}</span>
        <span class="msg-time">${m.created_at || 'Recently'}</span>
      </div>
      ${m.subject ? `<div class="msg-subject">${escHtml(m.subject)}</div>` : ''}
      <p class="msg-body">${escHtml(m.message)}</p>
    </div>
  `).join('');
}

async function sendBroadcast() {
  const target = document.getElementById('broadcast-target').value;
  const message = document.getElementById('broadcast-message').value.trim();
  const user = document.getElementById('broadcast-user').value.trim();
  if (!message) { showToast('Enter a message', 'error'); return; }

  showLoading(true);
  try {
    await apiPost('broadcast.php', { target, message, user }, true);
    showToast('Broadcast sent!', 'success');
    document.getElementById('broadcast-message').value = '';
  } catch (e) {
    showToast('Broadcast sent! (Demo)', 'success');
    document.getElementById('broadcast-message').value = '';
  }
  showLoading(false);
}

document.getElementById('broadcast-target')?.addEventListener('change', function () {
  document.getElementById('specific-user-wrap').style.display = this.value === 'specific' ? 'block' : 'none';
});

/* ---- Banner Management ---- */
function previewBanner(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('banner-preview-img').src = e.target.result;
    document.getElementById('banner-preview-wrap').classList.remove('hidden');
  };
  reader.readAsDataURL(input.files[0]);
}

async function uploadBanner() {
  const file = document.getElementById('banner-file-input').files[0];
  const title = document.getElementById('banner-title-input').value.trim();
  const link = document.getElementById('banner-link-input').value.trim();
  if (!file) return;
  showLoading(true);
  try {
    const fd = new FormData();
    fd.append('banner', file);
    fd.append('title', title);
    fd.append('link', link);
    await apiFormPost('upload_banner.php', fd, true);
    showToast('Banner published!', 'success');
    loadAdminBannersList();
  } catch (e) { showToast('Banner published (Demo)!', 'success'); }
  showLoading(false);
}

async function loadAdminBannersList() {
  try {
    const res = await apiGet('banners.php', true);
    const grid = document.getElementById('banners-existing');
    grid.innerHTML = (res.banners || []).map(b => `
      <div class="banner-card">
        <img src="${b.image_url}" />
        <div class="banner-card-info"><span>${escHtml(b.title || 'Banner')}</span><button class="btn-danger" onclick="deleteBanner(${b.id})"><i class="fa fa-trash"></i></button></div>
      </div>
    `).join('');
  } catch (e) {}
}

async function deleteBanner(id) {
  showLoading(true);
  try { await apiPost('delete_banner.php', { banner_id: id }, true); showToast('Deleted', 'success'); loadAdminBannersList(); }
  catch (e) { showToast('Deleted (Demo)', 'success'); }
  showLoading(false);
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modals when clicking overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) closeModal(this.id);
  });
});

function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================
   API HELPERS
   ============================================ */
async function apiGet(endpoint, isAdmin = false) {
  const base = isAdmin ? App.ADMIN_API : App.API;
  const res = await fetch(base + endpoint, {
    headers: { 'X-User-Id': App.user?.id || '', 'X-Session': getSession() }
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function apiPost(endpoint, data, isAdmin = false) {
  const base = isAdmin ? App.ADMIN_API : App.API;
  const res = await fetch(base + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': App.user?.id || '', 'X-Session': getSession() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function apiFormPost(endpoint, formData, isAdmin = false) {
  const base = isAdmin ? App.ADMIN_API : App.API;
  const res = await fetch(base + endpoint, {
    method: 'POST',
    headers: { 'X-User-Id': App.user?.id || '', 'X-Session': getSession() },
    body: formData,
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function getSession() {
  let s = localStorage.getItem('ssl_session');
  if (!s) { s = Math.random().toString(36).substr(2); localStorage.setItem('ssl_session', s); }
  return s;
}

/* ============================================
   DEMO DATA
   ============================================ */
function getDemoCourses() {
  return [
    { id: 1, name: 'Complete Python Bootcamp 2024', seller: 'techguru', seller_name: 'Tech Guru', price: 499, category: 'programming', status: 'approved', rating: 4.8, review_count: 234, video_count: 42, description: 'Learn Python from scratch to advanced. Covers data structures, OOP, file handling, APIs, and more. Perfect for beginners and intermediate learners.', outcomes: 'Python basics,OOP concepts,File handling,APIs,Data structures', thumbnail: '' },
    { id: 2, name: 'UI/UX Design Mastery', seller: 'designpro', seller_name: 'Design Pro', price: 799, category: 'design', status: 'approved', rating: 4.6, review_count: 118, video_count: 28, description: 'Master modern UI/UX design principles. Learn Figma, design systems, user research, and prototyping from industry experts.', outcomes: 'Figma mastery,Design systems,User research,Prototyping', thumbnail: '' },
    { id: 3, name: 'Digital Marketing Strategy', seller: 'marketmaster', seller_name: 'Market Master', price: 399, category: 'marketing', status: 'approved', rating: 4.5, review_count: 89, video_count: 22, description: 'Drive business growth with modern digital marketing. SEO, social media, content strategy, and analytics.', outcomes: 'SEO,Social media marketing,Content strategy,Analytics', thumbnail: '' },
    { id: 4, name: 'JavaScript Full Stack Dev', seller: 'webdev101', seller_name: 'WebDev 101', price: 999, category: 'programming', status: 'approved', rating: 4.9, review_count: 456, video_count: 68, description: 'Build complete web applications with JavaScript. React, Node.js, Express, MongoDB — full stack from front to back.', outcomes: 'React,Node.js,MongoDB,Express,REST APIs', thumbnail: '' },
    { id: 5, name: 'Photography for Beginners', seller: 'snapmaster', seller_name: 'Snap Master', price: 299, category: 'photography', status: 'approved', rating: 4.4, review_count: 67, video_count: 18, description: 'Start your photography journey. Learn composition, lighting, camera settings, and post-processing.', outcomes: 'Camera settings,Composition,Lighting,Post-processing', thumbnail: '' },
    { id: 6, name: 'Business Analytics with Excel', seller: 'bizanalyst', seller_name: 'Biz Analyst', price: 0, category: 'business', status: 'approved', rating: 4.3, review_count: 201, video_count: 15, description: 'Free course on business analytics using Excel. Pivot tables, VLOOKUP, charts, and dashboards.', outcomes: 'Excel functions,Pivot tables,Data visualization,Dashboards', thumbnail: '' },
    { id: 7, name: 'Guitar for Absolute Beginners', seller: 'musicpro', seller_name: 'Music Pro', price: 199, category: 'music', status: 'pending', rating: null, review_count: 0, video_count: 12, description: 'Learn guitar from zero to playing your first songs. Chords, strumming patterns, and music theory basics.', outcomes: 'Basic chords,Strumming,Music theory,Songs', thumbnail: '' },
    { id: 8, name: 'Machine Learning A-Z', seller: 'aimaster', seller_name: 'AI Master', price: 1299, category: 'programming', status: 'approved', rating: 4.7, review_count: 312, video_count: 55, description: 'Comprehensive ML course covering supervised, unsupervised learning, neural networks, and real-world projects with Python and scikit-learn.', outcomes: 'Python ML,Scikit-learn,Neural networks,Projects', thumbnail: '' },
  ];
}

function getDemoVideos(courseName) {
  return [
    { title: 'Introduction & Course Overview', url: '' },
    { title: 'Setting Up Your Environment', url: '' },
    { title: 'Core Concepts – Part 1', url: '' },
    { title: 'Core Concepts – Part 2', url: '' },
    { title: 'Practical Project', url: '' },
    { title: 'Advanced Topics', url: '' },
    { title: 'Conclusion & Next Steps', url: '' },
  ];
}

function getDemoReviews() {
  return [
    { username: 'rahul_dev', rating: 5, review: 'Absolutely amazing course! Learned so much in a short time. Highly recommend.' },
    { username: 'priya_learns', rating: 4, review: 'Great content and well-structured. The instructor explains everything clearly.' },
    { username: 'amit_coder', rating: 5, review: 'Worth every rupee! The project sections really helped me understand the concepts.' },
  ];
}

function getDemoUsers() {
  return [
    { id: 1, username: 'rahul_dev', email: 'rahul@example.com', joined: '2 weeks ago' },
    { id: 2, username: 'priya_learns', email: 'priya@example.com', joined: '1 month ago' },
    { id: 3, username: 'amit_coder', email: 'amit@example.com', joined: '3 days ago' },
    { id: 4, username: 'neha_designs', email: 'neha@example.com', joined: '1 week ago' },
    { id: 5, username: 'vikram_pro', email: 'vikram@example.com', joined: '5 days ago' },
  ];
}

function getDemoMessages() {
  return [
    { id: 1, username: 'rahul_dev', subject: 'Payment Issue', message: 'I paid for a course but it\'s not showing in my purchased courses. Please help!', created_at: '2 hours ago' },
    { id: 2, username: 'priya_learns', subject: 'Video not loading', message: 'The videos in Module 3 of the Python course are not loading on my phone.', created_at: '1 day ago' },
    { id: 3, username: 'new_user_123', subject: 'How to become a seller?', message: 'I want to upload my photography course. How does the approval process work?', created_at: '3 days ago' },
  ];
}

function getDemoActivity() {
  return [
    { icon: 'user-plus', text: 'New user registered: rahul_dev', time: '5m ago' },
    { icon: 'book', text: 'New course submitted: Guitar Basics', time: '1h ago' },
    { icon: 'shopping-cart', text: 'Course purchased: Python Bootcamp', time: '2h ago' },
    { icon: 'star', text: 'New review on: UI/UX Mastery', time: '4h ago' },
    { icon: 'envelope', text: 'New help message from: priya_learns', time: '1d ago' },
  ];
}
