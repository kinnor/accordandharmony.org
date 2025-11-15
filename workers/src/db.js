/**
 * Database Helper Functions
 * Provides safe database operations with error handling
 */

import { nanoid } from 'nanoid';

/**
 * Execute a database query with error handling
 */
export async function dbQuery(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).all();
    return { success: true, results: result.results, meta: result.meta };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a single row query
 */
export async function dbQueryOne(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).first();
    return { success: true, result };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function dbExecute(db, query, params = []) {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return { success: true, meta: result.meta };
  } catch (error) {
    console.error('Database execute error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Generate a secure unique ID
 */
export function generateId(prefix = '') {
  return prefix ? `${prefix}_${nanoid()}` : nanoid();
}

/**
 * User database operations
 */
export const UserDB = {
  /**
   * Create a new user
   */
  async create(db, userData) {
    const id = generateId('usr');
    const now = getCurrentTimestamp();

    const query = `
      INSERT INTO users (
        id, email, email_verified, password_hash, full_name,
        oauth_provider, oauth_id, profile_picture,
        created_at, updated_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const params = [
      id,
      userData.email.toLowerCase(),
      userData.email_verified || 0,
      userData.password_hash || null,
      userData.full_name,
      userData.oauth_provider || null,
      userData.oauth_id || null,
      userData.profile_picture || null,
      now,
      now
    ];

    const result = await dbExecute(db, query, params);
    if (result.success) {
      return { success: true, userId: id };
    }
    return result;
  },

  /**
   * Find user by email
   */
  async findByEmail(db, email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    return await dbQueryOne(db, query, [email.toLowerCase()]);
  },

  /**
   * Find user by ID
   */
  async findById(db, id) {
    const query = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
    return await dbQueryOne(db, query, [id]);
  },

  /**
   * Find or create OAuth user
   */
  async findOrCreateOAuth(db, oauthData) {
    // Try to find existing user
    const query = 'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ? AND is_active = 1';
    const existing = await dbQueryOne(db, query, [oauthData.provider, oauthData.id]);

    if (existing.success && existing.result) {
      return { success: true, user: existing.result, created: false };
    }

    // Check if email exists
    const emailCheck = await this.findByEmail(db, oauthData.email);
    if (emailCheck.success && emailCheck.result) {
      // Update existing user with OAuth info
      const updateQuery = `
        UPDATE users
        SET oauth_provider = ?, oauth_id = ?, profile_picture = ?, updated_at = ?
        WHERE email = ?
      `;
      await dbExecute(db, updateQuery, [
        oauthData.provider,
        oauthData.id,
        oauthData.profile_picture,
        getCurrentTimestamp(),
        oauthData.email
      ]);

      const updated = await this.findByEmail(db, oauthData.email);
      return { success: true, user: updated.result, created: false };
    }

    // Create new user
    const createResult = await this.create(db, {
      email: oauthData.email,
      full_name: oauthData.name,
      oauth_provider: oauthData.provider,
      oauth_id: oauthData.id,
      profile_picture: oauthData.profile_picture,
      email_verified: 1
    });

    if (createResult.success) {
      const user = await this.findById(db, createResult.userId);
      return { success: true, user: user.result, created: true };
    }

    return createResult;
  },

  /**
   * Update last login time
   */
  async updateLastLogin(db, userId) {
    const query = 'UPDATE users SET last_login = ? WHERE id = ?';
    return await dbExecute(db, query, [getCurrentTimestamp(), userId]);
  },

  /**
   * Update user profile
   */
  async updateProfile(db, userId, updates) {
    const allowedFields = ['full_name', 'phone', 'address_line1', 'address_line2', 'city', 'postal_code', 'country'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    fields.push('updated_at = ?');
    values.push(getCurrentTimestamp(), userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    return await dbExecute(db, query, values);
  }
};

/**
 * Transaction database operations
 */
export const TransactionDB = {
  /**
   * Create a new transaction
   */
  async create(db, transactionData) {
    const id = generateId('txn');
    const now = getCurrentTimestamp();

    const query = `
      INSERT INTO transactions (
        id, user_id, product_id, amount_cents, currency,
        payment_method, payment_status, transaction_type,
        is_recurring, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      transactionData.user_id,
      transactionData.product_id || null,
      transactionData.amount_cents,
      transactionData.currency || 'EUR',
      transactionData.payment_method,
      transactionData.payment_status || 'pending',
      transactionData.transaction_type,
      transactionData.is_recurring || 0,
      now,
      now
    ];

    const result = await dbExecute(db, query, params);
    if (result.success) {
      return { success: true, transactionId: id };
    }
    return result;
  },

  /**
   * Update transaction with Stripe info
   */
  async updateStripeInfo(db, transactionId, stripeData) {
    const query = `
      UPDATE transactions
      SET stripe_payment_intent_id = ?,
          stripe_customer_id = ?,
          stripe_session_id = ?,
          updated_at = ?
      WHERE id = ?
    `;

    return await dbExecute(db, query, [
      stripeData.payment_intent_id,
      stripeData.customer_id,
      stripeData.session_id,
      getCurrentTimestamp(),
      transactionId
    ]);
  },

  /**
   * Mark transaction as completed
   */
  async markCompleted(db, transactionId) {
    const query = `
      UPDATE transactions
      SET payment_status = 'completed',
          completed_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    return await dbExecute(db, query, [
      getCurrentTimestamp(),
      getCurrentTimestamp(),
      transactionId
    ]);
  },

  /**
   * Find transaction by Stripe payment intent
   */
  async findByStripeIntent(db, paymentIntentId) {
    const query = 'SELECT * FROM transactions WHERE stripe_payment_intent_id = ?';
    return await dbQueryOne(db, query, [paymentIntentId]);
  },

  /**
   * Get user transactions
   */
  async getUserTransactions(db, userId, limit = 50) {
    const query = `
      SELECT t.*, p.name as product_name
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    return await dbQuery(db, query, [userId, limit]);
  }
};

/**
 * Product database operations
 */
export const ProductDB = {
  /**
   * Get product by ID
   */
  async findById(db, productId) {
    const query = 'SELECT * FROM products WHERE id = ? AND is_active = 1';
    return await dbQueryOne(db, query, [productId]);
  },

  /**
   * Get all active products
   */
  async getAllActive(db) {
    const query = 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC';
    return await dbQuery(db, query);
  },

  /**
   * Increment sales count
   */
  async incrementSales(db, productId) {
    const query = 'UPDATE products SET total_sales = total_sales + 1, updated_at = ? WHERE id = ?';
    return await dbExecute(db, query, [getCurrentTimestamp(), productId]);
  }
};

/**
 * Download database operations
 */
export const DownloadDB = {
  /**
   * Create download record
   */
  async create(db, downloadData) {
    const id = generateId('dl');
    const now = getCurrentTimestamp();

    const query = `
      INSERT INTO downloads (
        id, user_id, transaction_id, product_id,
        download_token, token_expires_at, watermark_text,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

    const params = [
      id,
      downloadData.user_id,
      downloadData.transaction_id,
      downloadData.product_id,
      downloadData.download_token,
      tokenExpiry.toISOString(),
      downloadData.watermark_text,
      now,
      now
    ];

    const result = await dbExecute(db, query, params);
    if (result.success) {
      return { success: true, downloadId: id };
    }
    return result;
  },

  /**
   * Find download by token
   */
  async findByToken(db, token) {
    const query = `
      SELECT d.*, p.name as product_name, p.file_key, u.email, u.full_name
      FROM downloads d
      JOIN products p ON d.product_id = p.id
      JOIN users u ON d.user_id = u.id
      WHERE d.download_token = ?
    `;
    return await dbQueryOne(db, query, [token]);
  },

  /**
   * Increment download count
   */
  async incrementDownload(db, downloadId, ipAddress) {
    // Get current IP addresses
    const download = await dbQueryOne(db, 'SELECT ip_addresses FROM downloads WHERE id = ?', [downloadId]);

    let ips = [];
    if (download.success && download.result && download.result.ip_addresses) {
      try {
        ips = JSON.parse(download.result.ip_addresses);
      } catch (e) {
        ips = [];
      }
    }

    if (!ips.includes(ipAddress)) {
      ips.push(ipAddress);
    }

    const now = getCurrentTimestamp();
    const query = `
      UPDATE downloads
      SET download_count = download_count + 1,
          last_download_at = ?,
          first_download_at = COALESCE(first_download_at, ?),
          ip_addresses = ?,
          updated_at = ?
      WHERE id = ?
    `;

    return await dbExecute(db, query, [now, now, JSON.stringify(ips), now, downloadId]);
  },

  /**
   * Update watermarked file key
   */
  async updateWatermarkedFile(db, downloadId, fileKey) {
    const query = `
      UPDATE downloads
      SET watermarked_file_key = ?,
          watermark_created_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    const now = getCurrentTimestamp();
    return await dbExecute(db, query, [fileKey, now, now, downloadId]);
  }
};

/**
 * Session database operations
 */
export const SessionDB = {
  /**
   * Create new session
   */
  async create(db, sessionData) {
    const id = generateId('sess');
    const now = getCurrentTimestamp();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const query = `
      INSERT INTO sessions (
        id, user_id, refresh_token, access_token_hash,
        device_info, ip_address, expires_at, created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      sessionData.user_id,
      sessionData.refresh_token,
      sessionData.access_token_hash,
      sessionData.device_info || null,
      sessionData.ip_address || null,
      expiresAt.toISOString(),
      now,
      now
    ];

    const result = await dbExecute(db, query, params);
    if (result.success) {
      return { success: true, sessionId: id };
    }
    return result;
  },

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(db, refreshToken) {
    const query = `
      SELECT s.*, u.email, u.full_name, u.is_active as user_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ? AND s.is_active = 1 AND s.expires_at > ?
    `;
    return await dbQueryOne(db, query, [refreshToken, getCurrentTimestamp()]);
  },

  /**
   * Update last used time
   */
  async updateLastUsed(db, sessionId) {
    const query = 'UPDATE sessions SET last_used_at = ? WHERE id = ?';
    return await dbExecute(db, query, [getCurrentTimestamp(), sessionId]);
  },

  /**
   * Revoke session
   */
  async revoke(db, sessionId) {
    const query = 'UPDATE sessions SET is_active = 0, revoked_at = ? WHERE id = ?';
    return await dbExecute(db, query, [getCurrentTimestamp(), sessionId]);
  },

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(db, userId) {
    const query = 'UPDATE sessions SET is_active = 0, revoked_at = ? WHERE user_id = ? AND is_active = 1';
    return await dbExecute(db, query, [getCurrentTimestamp(), userId]);
  }
};

/**
 * Email log database operations
 */
export const EmailLogDB = {
  /**
   * Create email log entry
   */
  async create(db, emailData) {
    const id = generateId('eml');
    const now = getCurrentTimestamp();

    const query = `
      INSERT INTO email_logs (
        id, user_id, email_to, email_type, subject,
        provider, provider_message_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      emailData.user_id || null,
      emailData.email_to,
      emailData.email_type,
      emailData.subject,
      emailData.provider || 'resend',
      emailData.provider_message_id || null,
      emailData.status || 'pending',
      now
    ];

    const result = await dbExecute(db, query, params);
    if (result.success) {
      return { success: true, emailLogId: id };
    }
    return result;
  },

  /**
   * Update email status
   */
  async updateStatus(db, emailLogId, status, deliveredAt = null) {
    const now = getCurrentTimestamp();
    const query = `
      UPDATE email_logs
      SET status = ?,
          sent_at = COALESCE(sent_at, ?),
          delivered_at = ?,
          updated_at = ?
      WHERE id = ?
    `;

    return await dbExecute(db, query, [status, now, deliveredAt, now, emailLogId]);
  }
};

/**
 * Audit log database operations
 */
export const AuditLogDB = {
  /**
   * Create audit log entry
   */
  async create(db, auditData) {
    const id = generateId('aud');
    const now = getCurrentTimestamp();

    const query = `
      INSERT INTO audit_logs (
        id, user_id, action_type, entity_type, entity_id,
        ip_address, user_agent, changes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      auditData.user_id || null,
      auditData.action_type,
      auditData.entity_type || null,
      auditData.entity_id || null,
      auditData.ip_address || null,
      auditData.user_agent || null,
      auditData.changes ? JSON.stringify(auditData.changes) : null,
      now
    ];

    return await dbExecute(db, query, params);
  }
};
