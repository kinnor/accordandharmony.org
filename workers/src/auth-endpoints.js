/**
 * Authentication API Endpoints
 * Handles user registration, login, OAuth, and session management
 */

import { jsonResponse } from './utils.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  handleGoogleOAuth,
  handleFacebookOAuth,
  getRequestInfo
} from './auth.js';
import { sendWelcomeEmail } from './email-service.js';

/**
 * POST /api/auth/register
 * Register new user with email/password
 */
export async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return jsonResponse(false, 'Missing required fields', {}, 400);
    }

    // Register user
    const result = await registerUser(env.DB, { email, password, full_name });

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 400);
    }

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(env, {
      to: email,
      userName: full_name,
      userId: result.userId
    }).catch(err => console.error('Welcome email error:', err));

    return jsonResponse(true, 'Registration successful', {
      userId: result.userId,
      email: email,
      message: 'Please check your email to verify your account'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse(false, 'Registration failed', {}, 500);
  }
}

/**
 * POST /api/auth/login
 * Login with email/password
 */
export async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse(false, 'Email and password required', {}, 400);
    }

    const requestInfo = getRequestInfo(request);
    const result = await loginUser(env.DB, env.JWT_SECRET, { email, password }, requestInfo);

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 401);
    }

    return jsonResponse(true, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse(false, 'Login failed', {}, 500);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function handleRefreshToken(request, env) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonResponse(false, 'Refresh token required', {}, 400);
    }

    const result = await refreshAccessToken(env.DB, env.JWT_SECRET, refreshToken);

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 401);
    }

    return jsonResponse(true, 'Token refreshed', {
      accessToken: result.accessToken,
      user: result.user
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return jsonResponse(false, 'Token refresh failed', {}, 500);
  }
}

/**
 * POST /api/auth/logout
 * Logout user and revoke session
 */
export async function handleLogout(request, env) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (refreshToken) {
      await logoutUser(env.DB, refreshToken);
    }

    return jsonResponse(true, 'Logged out successfully');

  } catch (error) {
    console.error('Logout error:', error);
    return jsonResponse(false, 'Logout failed', {}, 500);
  }
}

/**
 * POST /api/auth/google
 * Handle Google OAuth callback
 */
export async function handleGoogleAuth(request, env) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return jsonResponse(false, 'Authorization code required', {}, 400);
    }

    const requestInfo = getRequestInfo(request);
    const result = await handleGoogleOAuth(env.DB, env.JWT_SECRET, code, env, requestInfo);

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 400);
    }

    // Send welcome email to new users
    if (result.isNewUser) {
      sendWelcomeEmail(env, {
        to: result.user.email,
        userName: result.user.full_name,
        userId: result.user.id
      }).catch(err => console.error('Welcome email error:', err));
    }

    return jsonResponse(true, 'Authentication successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return jsonResponse(false, 'Authentication failed', {}, 500);
  }
}

/**
 * POST /api/auth/facebook
 * Handle Facebook OAuth callback
 */
export async function handleFacebookAuth(request, env) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return jsonResponse(false, 'Authorization code required', {}, 400);
    }

    const requestInfo = getRequestInfo(request);
    const result = await handleFacebookOAuth(env.DB, env.JWT_SECRET, code, env, requestInfo);

    if (!result.success) {
      return jsonResponse(false, result.error, {}, 400);
    }

    // Send welcome email to new users
    if (result.isNewUser) {
      sendWelcomeEmail(env, {
        to: result.user.email,
        userName: result.user.full_name,
        userId: result.user.id
      }).catch(err => console.error('Welcome email error:', err));
    }

    return jsonResponse(true, 'Authentication successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser
    });

  } catch (error) {
    console.error('Facebook auth error:', error);
    return jsonResponse(false, 'Authentication failed', {}, 500);
  }
}

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
export async function handleGetMe(request, env, authResult) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const user = authResult.user;

    return jsonResponse(true, 'User info retrieved', {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        created_at: user.created_at,
        email_verified: user.email_verified
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return jsonResponse(false, 'Failed to get user info', {}, 500);
  }
}
