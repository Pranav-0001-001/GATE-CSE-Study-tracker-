/**
 * GATETrack - Profile & Badges Showcase Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();
  await loadBadges();
  initProfileForm();
});

async function loadProfile() {
  try {
    const data = await API.request('/api/profile');
    const user = data.user;
    const stats = data.stats;

    // Set Header & Mini Card
    const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : 'G';
    document.getElementById('profile-avatar-letter').textContent = initial;
    document.getElementById('profile-display-name').textContent = user.name;
    document.getElementById('profile-display-email').textContent = user.email;

    const joinDate = new Date(user.created_at || Date.now());
    document.getElementById('profile-joined-date').textContent = `Member since ${joinDate.toLocaleDateString([], { month: 'short', year: 'numeric' })}`;

    // Mini Stats
    document.getElementById('profile-stat-hours').textContent = `${stats.totalHours}h`;
    document.getElementById('profile-stat-streak').textContent = `🔥 ${stats.currentStreak}d`;
    document.getElementById('profile-stat-syllabus').textContent = `${stats.syllabusPercentage}%`;
    document.getElementById('profile-stat-badges').textContent = `${stats.unlockedBadgesCount}/${stats.totalBadgesCount}`;

    // Populate Form Inputs
    document.getElementById('profile-name-input').value = user.name;
    document.getElementById('profile-target-hours-input').value = user.daily_target_hours || 6;
    document.getElementById('profile-theme-select').value = user.theme || 'dark';

  } catch (err) {
    console.error('Failed to load profile:', err);
    API.showToast('Failed to load profile data.', 'error');
  }
}

async function loadBadges() {
  const container = document.getElementById('badges-catalog-grid');
  if (!container) return;

  try {
    const data = await API.request('/api/badges');
    const badges = data.badges || [];

    container.innerHTML = badges.map(b => {
      const isUnlocked = Boolean(b.is_unlocked);
      const unlockedDate = b.unlocked_at ? new Date(b.unlocked_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : null;

      return `
        <div class="badge-tile ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-tile-icon">${b.icon}</div>
          <div class="badge-tile-name">${escapeHTML(b.name)}</div>
          <div class="badge-tile-desc">${escapeHTML(b.description)}</div>
          ${isUnlocked 
            ? `<div class="badge-unlocked-tag">✓ Unlocked ${unlockedDate ? `(${unlockedDate})` : ''}</div>` 
            : `<div class="text-xs text-muted" style="margin-top: 0.75rem;">🔒 Locked</div>`}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load badges:', err);
  }
}

function initProfileForm() {
  const form = document.getElementById('profile-edit-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profile-name-input').value.trim();
    const targetHours = document.getElementById('profile-target-hours-input').value;
    const theme = document.getElementById('profile-theme-select').value;
    const submitBtn = document.getElementById('profile-save-btn');

    if (!name) {
      API.showToast('Please enter your name.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
      const res = await API.request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          daily_target_hours: targetHours,
          theme
        })
      });

      API.setUser(res.user);
      setTheme(res.user.theme, false);
      API.showToast('Profile updated successfully! ✅');

      // Refresh displayed name & avatar
      document.getElementById('profile-display-name').textContent = res.user.name;
      document.getElementById('profile-avatar-letter').textContent = res.user.name.charAt(0).toUpperCase();

      const sidebarName = document.getElementById('sidebar-user-name');
      if (sidebarName) sidebarName.textContent = res.user.name;
    } catch (err) {
      API.showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
