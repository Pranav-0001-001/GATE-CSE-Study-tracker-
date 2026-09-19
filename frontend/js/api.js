/**
 * GATETrack - Core API Client & Global Helpers
 */

const API = {
  TOKEN_KEY: 'gatetrack_token',
  USER_KEY: 'gatetrack_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  getUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
    }
  },

  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /**
   * Determine backend base URL dynamically.
   * If running directly via file:// or another dev port, target http://localhost:3000.
   */
  getBaseUrl() {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000')) {
      return 'http://localhost:3000';
    }
    return '';
  },

  /**
   * Main fetch wrapper
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const baseUrl = this.getBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.clearAuth();
        const currentPath = window.location.pathname;
        if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
          window.location.href = 'login.html';
        }
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unexpected error occurred.');
      }

      return data;
    } catch (err) {
      // Catch network-level failures (server not running, connection refused)
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
        const helpfulError = 'Cannot connect to GATETrack server at http://localhost:3000. Please ensure the backend server is running (run start-gatetrack.bat or npm start).';
        console.error(helpfulError, err);
        throw new Error(helpfulError);
      }
      console.error(`API Error [${url}]:`, err);
      throw err;
    }
  },

  /**
   * Toast notification display
   */
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  },

  /**
   * Format seconds to human friendly study time (e.g. 1h 42m, 45m, 0m)
   */
  formatHoursMinutes(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  },

  /**
   * Format seconds to HH:MM:SS
   */
  formatHHMMSS(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const pad = n => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
};

// Check authentication on protected pages
(function checkRouteAuth() {
  const protectedPages = [
    'dashboard.html',
    'timer.html',
    'syllabus.html',
    'habits.html',
    'analytics.html',
    'profile.html'
  ];

  const currentFile = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentFile)) {
    const token = API.getToken();
    if (!token) {
      window.location.href = 'login.html';
    }
  }

  // Check server health on page load
  window.addEventListener('DOMContentLoaded', () => {
    checkServerOnline();
  });

  async function checkServerOnline() {
    const baseUrl = API.getBaseUrl();
    const healthUrl = `${baseUrl}/api/health`;

    try {
      const res = await fetch(healthUrl, { method: 'GET' });
      if (res.ok) {
        const existingBanner = document.getElementById('server-offline-banner');
        if (existingBanner) existingBanner.remove();
      }
    } catch {
      showOfflineBanner();
    }
  }

  function showOfflineBanner() {
    if (document.getElementById('server-offline-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'server-offline-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #F59E0B, #D97706);
      color: #0F172A;
      padding: 0.6rem 1rem;
      text-align: center;
      font-size: 0.85rem;
      font-weight: 700;
      z-index: 99999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    `;
    banner.innerHTML = `
      <span>⚠️</span>
      <span><strong>GATETrack Server is Offline:</strong> Please start the backend server by double-clicking <code>start-gatetrack.bat</code> or running <code>npm start</code> in terminal.</span>
    `;
    document.body.prepend(banner);
  }
})();
