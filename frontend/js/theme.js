/**
 * GATETrack - Theme Management (Light / Dark)
 * Avoids Flash of Unstyled Theme (FOUC)
 */

(function () {
  const savedTheme = localStorage.getItem('gatetrack_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function setTheme(theme, syncWithBackend = true) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('gatetrack_theme', theme);

  // Update theme toggle button text/icon if present
  const themeToggles = document.querySelectorAll('.theme-toggle-btn');
  themeToggles.forEach(btn => {
    const iconSpan = btn.querySelector('.theme-icon');
    const textSpan = btn.querySelector('.theme-text');
    if (theme === 'dark') {
      if (iconSpan) iconSpan.textContent = '🌙';
      if (textSpan) textSpan.textContent = 'Dark Mode';
    } else {
      if (iconSpan) iconSpan.textContent = '☀️';
      if (textSpan) textSpan.textContent = 'Light Mode';
    }
  });

  if (syncWithBackend && window.API && API.getToken()) {
    API.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ theme })
    }).catch(() => {});
  }
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
}

document.addEventListener('DOMContentLoaded', () => {
  // Synchronize button text on initial load
  setTheme(getTheme(), false);
});
