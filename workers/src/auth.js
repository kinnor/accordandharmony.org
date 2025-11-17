/**
 * Authentication Service
 * Handles JWT tokens, password hashing, and OAuth
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { UserDB, SessionDB, AuditLogDB } from './db.js';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token (short-lived)
 */
export function generateAccessToken(user, jwtSecret) {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'access'
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: '15m' // 15 minutes
  });
}

/**
 * Generate JWT refresh token (long-lived)
 */
export function generateRefreshToken(user, jwtSecret) {
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'refresh',
    jti: nanoid() // JWT ID for tracking
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: '30d' // 30 days
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token, jwtSecret) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { expired: true, error: 'Token expired' };
    }
    return { invalid: true, error: 'Invalid token' };
  }
}

/**
 * Hash a token for storage (one-way hash)
 */
export async function hashToken(token) {
  // Use SHA-256 for token hashing (faster than bcrypt for tokens)
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware: Authenticate request
 */
export async function authenticateRequest(request, env) {
  const token = extractBearerToken(request);

  if (!token) {
    return {
      authenticated: false,
      error: 'No token provided',
      status: 401
    };
  }

  const decoded = verifyToken(token, env.JWT_SECRET);

  if (decoded.expired) {
    return {
      authenticated: false,
      error: 'Token expired',
      status: 401,
      expired: true
    };
  }

  if (decoded.invalid) {
    return {
      authenticated: false,
      error: 'Invalid token',
      status: 401
    };
  }

  // Check if user still exists and is active
  const userResult = await UserDB.findById(env.DB, decoded.userId);

  if (!userResult.success || !userResult.result) {
    return {
      authenticated: false,
      error: 'User not found',
      status: 401
    };
  }

  if (!userResult.result.is_active) {
    return {
      authenticated: false,
      error: 'Account deactivated',
      status: 403
    };
  }

  return {
    authenticated: true,
    user: userResult.result,
    token: decoded
  };
}

/**
 * Register a new user with email/password
 */
export async function registerUser(db, { email, password, full_name }) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format'
    };
  }

  // Validate password strength
  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters long'
    };
  }

  // Check if user already exists
  const existing = await UserDB.findByEmail(db, email);
  if (existing.success && existing.result) {
    return {
      success: false,
      error: 'Email already registered'
    };
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const result = await UserDB.create(db, {
    email,
    password_hash,
    full_name,
    oauth_provider: 'email',
    email_verified: 0
  });

  return result;
}

/**
 * Login with email/password
 */
export async function loginUser(db, jwtSecret, { email, password }, requestInfo = {}) {
  // Find user
  const userResult = await UserDB.findByEmail(db, email);

  if (!userResult.success || !userResult.result) {
    return {
      success: false,
      error: 'Invalid email or password'
    };
  }

  const user = userResult.result;

  // Check if account is banned
  if (user.is_banned) {
    return {
      success: false,
      error: 'Account has been suspended. Please contact support.'
    };
  }

  // Verify password (if user has password - OAuth users might not)
  if (!user.password_hash) {
    return {
      success: false,
      error: 'Please login with your social account'
    };
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    return {
      success: false,
      error: 'Invalid email or password'
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user, jwtSecret);
  const refreshToken = generateRefreshToken(user, jwtSecret);

  // Store session
  const accessTokenHash = await hashToken(accessToken);
  await SessionDB.create(db, {
    user_id: user.id,
    refresh_token: refreshToken,
    access_token_hash: accessTokenHash,
    device_info: requestInfo.userAgent,
    ip_address: requestInfo.ipAddress
  });

  // Update last login
  await UserDB.updateLastLogin(db, user.id);

  // Log the login
  await AuditLogDB.create(db, {
    user_id: user.id,
    action_type: 'login',
    entity_type: 'user',
    entity_id: user.id,
    ip_address: requestInfo.ipAddress,
    user_agent: requestInfo.userAgent
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profile_picture: user.profile_picture
    },
    accessToken,
    refreshToken
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(db, jwtSecret, refreshToken) {
  // Verify refresh token
  const decoded = verifyToken(refreshToken, jwtSecret);

  if (decoded.expired || decoded.invalid) {
    return {
      success: false,
      error: 'Invalid or expired refresh token'
    };
  }

  // Find session
  const sessionResult = await SessionDB.findByRefreshToken(db, refreshToken);

  if (!sessionResult.success || !sessionResult.result) {
    return {
      success: false,
      error: 'Session not found'
    };
  }

  const session = sessionResult.result;

  // Check if user is still active
  if (!session.user_active) {
    return {
      success: false,
      error: 'Account deactivated'
    };
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    id: session.user_id,
    email: session.email
  }, jwtSecret);

  // Update session last used time
  await SessionDB.updateLastUsed(db, session.id);

  return {
    success: true,
    accessToken,
    user: {
      id: session.user_id,
      email: session.email,
      full_name: session.full_name
    }
  };
}

/**
 * Logout user (revoke session)
 */
export async function logoutUser(db, refreshToken) {
  const sessionResult = await SessionDB.findByRefreshToken(db, refreshToken);

  if (sessionResult.success && sessionResult.result) {
    await SessionDB.revoke(db, sessionResult.result.id);

    // Log the logout
    await AuditLogDB.create(db, {
      user_id: sessionResult.result.user_id,
      action_type: 'logout',
      entity_type: 'session',
      entity_id: sessionResult.result.id
    });
  }

  return { success: true };
}

/**
 * OAuth - Google
 * Exchange authorization code for user info
 */
export async function handleGoogleOAuth(db, jwtSecret, code, env, requestInfo = {}) {
  try {
    const redirectUri = `${env.FRONTEND_URL}/auth/google/callback`;

    console.log('Google OAuth - Exchange code for tokens', {
      hasCode: !!code,
      hasClientId: !!env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
      redirectUri
    });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Google token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return {
        success: false,
        error: `Failed to exchange Google authorization code: ${errorData.error_description || errorData.error || tokenResponse.statusText}`
      };
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      return {
        success: false,
        error: 'Failed to get Google user info'
      };
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    const userResult = await UserDB.findOrCreateOAuth(db, {
      provider: 'google',
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      profile_picture: googleUser.picture
    });

    if (!userResult.success) {
      return userResult;
    }

    const user = userResult.user;

    // Generate tokens
    const accessToken = generateAccessToken(user, jwtSecret);
    const refreshToken = generateRefreshToken(user, jwtSecret);

    // Store session
    const accessTokenHash = await hashToken(accessToken);
    await SessionDB.create(db, {
      user_id: user.id,
      refresh_token: refreshToken,
      access_token_hash: accessTokenHash,
      device_info: requestInfo.userAgent,
      ip_address: requestInfo.ipAddress
    });

    // Update last login
    await UserDB.updateLastLogin(db, user.id);

    // Log the login
    await AuditLogDB.create(db, {
      user_id: user.id,
      action_type: 'oauth_login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: requestInfo.ipAddress,
      user_agent: requestInfo.userAgent,
      changes: { provider: 'google', created: userResult.created }
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture
      },
      accessToken,
      refreshToken,
      isNewUser: userResult.created
    };

  } catch (error) {
    console.error('Google OAuth error:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: `OAuth authentication failed: ${error.message}`
    };
  }
}

/**
 * OAuth - Facebook
 * Exchange authorization code for user info
 */
export async function handleFacebookOAuth(db, jwtSecret, code, env, requestInfo = {}) {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${env.FACEBOOK_APP_ID}&` +
      `client_secret=${env.FACEBOOK_APP_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${env.FRONTEND_URL}/auth/facebook/callback`
    );

    if (!tokenResponse.ok) {
      return {
        success: false,
        error: 'Failed to exchange Facebook authorization code'
      };
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${tokens.access_token}`
    );

    if (!userInfoResponse.ok) {
      return {
        success: false,
        error: 'Failed to get Facebook user info'
      };
    }

    const fbUser = await userInfoResponse.json();

    if (!fbUser.email) {
      return {
        success: false,
        error: 'Email permission required'
      };
    }

    // Find or create user
    const userResult = await UserDB.findOrCreateOAuth(db, {
      provider: 'facebook',
      id: fbUser.id,
      email: fbUser.email,
      name: fbUser.name,
      profile_picture: fbUser.picture?.data?.url
    });

    if (!userResult.success) {
      return userResult;
    }

    const user = userResult.user;

    // Generate tokens
    const accessToken = generateAccessToken(user, jwtSecret);
    const refreshToken = generateRefreshToken(user, jwtSecret);

    // Store session
    const accessTokenHash = await hashToken(accessToken);
    await SessionDB.create(db, {
      user_id: user.id,
      refresh_token: refreshToken,
      access_token_hash: accessTokenHash,
      device_info: requestInfo.userAgent,
      ip_address: requestInfo.ipAddress
    });

    // Update last login
    await UserDB.updateLastLogin(db, user.id);

    // Log the login
    await AuditLogDB.create(db, {
      user_id: user.id,
      action_type: 'oauth_login',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: requestInfo.ipAddress,
      user_agent: requestInfo.userAgent,
      changes: { provider: 'facebook', created: userResult.created }
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture
      },
      accessToken,
      refreshToken,
      isNewUser: userResult.created
    };

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return {
      success: false,
      error: 'OAuth authentication failed'
    };
  }
}

/**
 * Get request metadata for logging
 */
export function getRequestInfo(request) {
  return {
    ipAddress: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown'
  };
}
