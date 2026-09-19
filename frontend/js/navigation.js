/**
 * GATETrack - Shared Navigation & User Layout Handler
 */

document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop() || 'index.html';

  // Highlight active links in sidebar and mobile nav
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName || (pageName === 'index.html' && href === 'dashboard.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Handle Theme Toggle Buttons
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof toggleTheme === 'function') {
        toggleTheme();
      }
    });
  });

  // Handle Logout Buttons
  const logoutBtns = document.querySelectorAll('.logout-btn, #logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await API.request('/api/auth/logout', { method: 'POST' });
      } catch {}
      API.clearAuth();
      window.location.href = 'login.html';
    });
  });

  // Populate User Information in Sidebar / Header
  const user = API.getUser();
  if (user) {
    updateUserUI(user);
  } else if (API.getToken()) {
    try {
      const data = await API.request('/api/auth/me');
      if (data.user) {
        API.setUser(data.user);
        updateUserUI(data.user);
        if (data.user.theme) {
          setTheme(data.user.theme, false);
        }
      }
    } catch {}
  }
});

function updateUserUI(user) {
  const nameElements = document.querySelectorAll('.user-name, #sidebar-user-name');
  const emailElements = document.querySelectorAll('.user-email, #sidebar-user-email');
  const avatarElements = document.querySelectorAll('.user-avatar, #sidebar-user-avatar');

  const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : 'G';

  nameElements.forEach(el => el.textContent = user.name);
  emailElements.forEach(el => el.textContent = user.email);
  avatarElements.forEach(el => el.textContent = initial);
}
