/**
 * GATETrack - Authentication Frontend Controller (Login & Register)
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated and visiting login/register, redirect to dashboard
  if (API.getToken()) {
    const page = window.location.pathname.split('/').pop();
    if (page === 'login.html' || page === 'register.html' || page === 'index.html' || page === '') {
      window.location.href = 'dashboard.html';
      return;
    }
  }

  // Password Visibility Toggles
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '👁️';
        } else {
          input.type = 'password';
          btn.textContent = '👁️‍🗨️';
        }
      }
    });
  });

  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitBtn = document.getElementById('login-submit-btn');

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email) {
        showError('Please enter your email address.');
        emailInput.focus();
        return;
      }

      if (!password) {
        showError('Please enter your password.');
        passwordInput.focus();
        return;
      }

      setLoading(submitBtn, true, 'Logging in...');

      try {
        const data = await API.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        API.setToken(data.token);
        API.setUser(data.user);

        if (data.user.theme) {
          setTheme(data.user.theme, false);
        }

        API.showToast('Login successful! Welcome back.');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 300);
      } catch (err) {
        showError(err.message || 'Invalid email or password.');
      } finally {
        setLoading(submitBtn, false, 'Login');
      }
    });
  }

  // Register Form Handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const submitBtn = document.getElementById('register-submit-btn');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!name) {
        showError('Please enter your full name.');
        nameInput.focus();
        return;
      }

      if (!email) {
        showError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        showError('Passwords do not match. Please verify.');
        confirmPasswordInput.focus();
        return;
      }

      setLoading(submitBtn, true, 'Creating account...');

      try {
        const data = await API.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, confirmPassword })
        });

        API.setToken(data.token);
        API.setUser(data.user);

        API.showToast('Account created successfully! Welcome to GATETrack.');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 400);
      } catch (err) {
        showError(err.message || 'Registration failed. Please check your details.');
      } finally {
        setLoading(submitBtn, false, 'Create Account');
      }
    });
  }
});

function showError(msg) {
  const banner = document.getElementById('auth-error');
  if (banner) {
    banner.textContent = msg;
    banner.style.display = 'block';
  } else {
    API.showToast(msg, 'error');
  }
}

function clearError() {
  const banner = document.getElementById('auth-error');
  if (banner) {
    banner.style.display = 'none';
    banner.textContent = '';
  }
}

function setLoading(btn, isLoading, text) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = text;
  }
}
