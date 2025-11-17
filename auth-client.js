/**
 * Authentication Client
 * Handles user authentication, registration, and session management
 */

// Use centralized config (loaded from config.js)
const API_BASE = window.CONFIG?.api.baseUrl || (
  window.location.hostname === 'localhost'
    ? 'http://localhost:8787/api'
    : 'https://accordandharmony.org/api'
);

// Authentication state
let currentUser = null;
let accessToken = null;
let refreshToken = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAuthState();
  initAuthModal();
  checkAuthStatus();
});

/**
 * Load auth state from localStorage
 */
function loadAuthState() {
  const stored = localStorage.getItem('auth');
  if (stored) {
    try {
      const auth = JSON.parse(stored);
      currentUser = auth.user;
      accessToken = auth.accessToken;
      refreshToken = auth.refreshToken;
    } catch (e) {
      console.error('Failed to load auth state:', e);
    }
  }
}

/**
 * Save auth state to localStorage
 */
function saveAuthState() {
  if (currentUser && accessToken && refreshToken) {
    localStorage.setItem('auth', JSON.stringify({
      user: currentUser,
      accessToken,
      refreshToken
    }));
  } else {
    localStorage.removeItem('auth');
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!currentUser && !!accessToken;
}

/**
 * Get current user
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Initialize authentication modal
 */
function initAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.auth-modal-close');
  const overlay = modal.querySelector('.auth-modal-overlay');
  const showRegisterLink = document.getElementById('showRegisterLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const loginForm = document.getElementById('emailLoginForm');
  const registerForm = document.getElementById('emailRegisterForm');
  const googleBtn = document.getElementById('googleLoginBtn');
  const facebookBtn = document.getElementById('facebookLoginBtn');

  // Close modal
  closeBtn.addEventListener('click', () => closeAuthModal());
  overlay.addEventListener('click', () => closeAuthModal());

  // Switch between login/register
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });

  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await handleEmailLogin(email, password);
  });

  // Handle registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    await handleEmailRegister(name, email, password);
  });

  // Social login
  if (googleBtn) {
    googleBtn.addEventListener('click', () => handleGoogleLogin());
  }

  if (facebookBtn) {
    facebookBtn.addEventListener('click', () => handleFacebookLogin());
  }
}

/**
 * Show authentication modal
 */
function showAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  showLoginForm(); // Default to login form
}

/**
 * Close authentication modal
 */
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * Show login form
 */
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('authModalTitle').textContent = 'Sign In to Continue';
  document.getElementById('authModalSubtitle').textContent = 'Create an account or sign in to purchase the book';
}

/**
 * Show register form
 */
function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Create Your Account';
  document.getElementById('authModalSubtitle').textContent = 'Join us to purchase educational resources';
}

/**
 * Handle email/password login
 */
async function handleEmailLogin(email, password) {
  const btn = document.getElementById('loginSubmitBtn');
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span>Signing in...</span>';

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    // Save authentication
    currentUser = data.data.user;
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
    saveAuthState();

    showMessage('Welcome back! Redirecting...', 'success');
    closeAuthModal();

    // Trigger auth success event
    window.dispatchEvent(new CustomEvent('authSuccess', { detail: currentUser }));

  } catch (error) {
    console.error('Login error:', error);
    showMessage(error.message || 'Login failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Handle email/password registration
 */
async function handleEmailRegister(full_name, email, password) {
  const btn = document.getElementById('registerSubmitBtn');
  const originalText = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<span>Creating account...</span>';

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    showMessage('Account created! Please sign in.', 'success');

    // Auto-fill login form
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
    showLoginForm();

    // Auto-login
    setTimeout(() => handleEmailLogin(email, password), 1000);

  } catch (error) {
    console.error('Registration error:', error);
    showMessage(error.message || 'Registration failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Handle Google OAuth login
 */
function handleGoogleLogin() {
  // Use config values
  const clientId = window.CONFIG?.oauth.google.clientId || '';
  const redirectUri = window.CONFIG?.redirects.google || `${window.location.origin}/auth/google/callback`;
  const scope = window.CONFIG?.oauth.google.scopes || 'email profile openid';

  if (!clientId) {
    console.error('Google Client ID not configured in config.js');
    showMessage('Google Sign-In is not configured', 'error');
    return;
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=google`;

  window.location.href = authUrl;
}

/**
 * Handle Facebook OAuth login
 */
function handleFacebookLogin() {
  // Use config values
  const appId = window.CONFIG?.oauth.facebook.appId || '';
  const redirectUri = window.CONFIG?.redirects.facebook || `${window.location.origin}/auth/facebook/callback`;
  const scope = window.CONFIG?.oauth.facebook.scopes || 'email';

  if (!appId || appId === 'YOUR_FACEBOOK_APP_ID') {
    console.error('Facebook App ID not configured in config.js');
    showMessage('Facebook Sign-In is not configured', 'error');
    return;
  }

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}&` +
    `state=facebook`;

  window.location.href = authUrl;
}

/**
 * Logout user
 */
async function logout() {
  try {
    if (refreshToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }

  currentUser = null;
  accessToken = null;
  refreshToken = null;
  saveAuthState();

  showMessage('Logged out successfully', 'success');
  window.location.reload();
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.success) {
      accessToken = data.data.accessToken;
      saveAuthState();
      return true;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
  }

  return false;
}

/**
 * Make authenticated API request
 */
async function authFetch(url, options = {}) {
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

/**
 * Check auth status on page load
 */
async function checkAuthStatus() {
  if (!isAuthenticated()) return;

  try {
    const response = await authFetch(`${API_BASE}/auth/me`);
    const data = await response.json();

    if (!data.success) {
      // Auth failed, clear state
      currentUser = null;
      accessToken = null;
      refreshToken = null;
      saveAuthState();
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}
