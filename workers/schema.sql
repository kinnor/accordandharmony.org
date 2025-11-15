-- Cloudflare D1 Database Schema for Accord and Harmony Foundation
-- Digital Product Sales with Authentication and Payment Processing

-- ============================================
-- Users Table
-- Stores user authentication and profile data
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0, -- 0 = false, 1 = true
  password_hash TEXT, -- NULL for OAuth-only users
  full_name TEXT NOT NULL,
  created_at TEXT NOT NULL, -- ISO 8601 timestamp
  updated_at TEXT NOT NULL,
  last_login TEXT,

  -- OAuth fields
  oauth_provider TEXT, -- 'google', 'facebook', 'email'
  oauth_id TEXT, -- Provider-specific user ID
  profile_picture TEXT,

  -- Tax receipt information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'BG',
  phone TEXT,

  -- Account status
  is_active INTEGER DEFAULT 1,
  is_banned INTEGER DEFAULT 0,

  -- Indexes
  CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- ============================================
-- Products Table
-- Digital products available for purchase
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL, -- Price in cents (EUR)
  currency TEXT DEFAULT 'EUR',
  product_type TEXT DEFAULT 'pdf_book', -- 'pdf_book', 'course', etc.

  -- Product metadata
  file_key TEXT, -- R2 bucket key for the original file
  file_size INTEGER, -- Bytes
  file_format TEXT, -- 'pdf', 'epub', etc.

  -- Book specific fields
  isbn TEXT,
  author TEXT,
  publisher TEXT,
  publication_year INTEGER,
  page_count INTEGER,

  -- Sales tracking
  total_sales INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active, created_at DESC);

-- Insert Jazz Trumpet Master Class book
INSERT OR IGNORE INTO products (
  id,
  name,
  description,
  price_cents,
  currency,
  product_type,
  file_key,
  author,
  publisher,
  publication_year,
  created_at,
  updated_at,
  is_active
) VALUES (
  'jazz-trumpet-masterclass-2025',
  'Jazz Trumpet Master Class',
  'Comprehensive guide to jazz trumpet techniques, improvisation, and performance. Published by Accord and Harmony Foundation. By purchasing this book, you directly support our foundation''s mission to provide educational opportunities to children across Bulgaria.',
  2500, -- €25.00
  'EUR',
  'pdf_book',
  'books/jazz-trumpet-masterclass.pdf',
  'Accord and Harmony Foundation',
  'Accord and Harmony Foundation',
  2025,
  datetime('now'),
  datetime('now'),
  1
);

-- ============================================
-- Transactions Table
-- Payment transactions and donation records
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT, -- NULL for regular donations

  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT, -- 'stripe', 'paypal', 'bank_transfer'
  payment_status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'

  -- Stripe specific
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_session_id TEXT,

  -- Transaction metadata
  transaction_type TEXT NOT NULL, -- 'donation', 'product_purchase'
  is_recurring INTEGER DEFAULT 0,

  -- Fulfillment tracking
  fulfillment_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  download_sent INTEGER DEFAULT 0, -- 0 = not sent, 1 = sent
  receipt_sent INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- Downloads Table
-- Track PDF download history with watermarking
-- ============================================
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5, -- Limit downloads per purchase
  first_download_at TEXT,
  last_download_at TEXT,

  -- Watermarked file
  watermarked_file_key TEXT, -- R2 key for personalized watermarked PDF
  watermark_text TEXT, -- Watermark applied to PDF
  watermark_created_at TEXT,

  -- Security
  download_token TEXT UNIQUE, -- Secure token for download link
  token_expires_at TEXT, -- Download links expire after 24 hours
  ip_addresses TEXT, -- JSON array of IP addresses used for downloads

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_transaction ON downloads(transaction_id);
CREATE INDEX IF NOT EXISTS idx_downloads_token ON downloads(download_token);

-- ============================================
-- Sessions Table
-- JWT session management and refresh tokens
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- Token data
  refresh_token TEXT UNIQUE NOT NULL,
  access_token_hash TEXT, -- Hash of current access token

  -- Session metadata
  device_info TEXT, -- User agent string
  ip_address TEXT,

  -- Expiration
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,

  -- Status
  is_active INTEGER DEFAULT 1,
  revoked_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- Email Logs Table
-- Track all emails sent to users
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email_to TEXT NOT NULL,

  -- Email details
  email_type TEXT NOT NULL, -- 'welcome', 'receipt', 'download', 'password_reset'
  subject TEXT NOT NULL,

  -- Delivery tracking
  provider TEXT, -- 'resend', 'sendgrid'
  provider_message_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'

  -- Metadata
  error_message TEXT,

  created_at TEXT NOT NULL,
  sent_at TEXT,
  delivered_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type, created_at DESC);

-- ============================================
-- Audit Log Table
-- Security and compliance audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,

  -- Action details
  action_type TEXT NOT NULL, -- 'login', 'purchase', 'download', 'password_change', etc.
  entity_type TEXT, -- 'user', 'transaction', 'download'
  entity_id TEXT,

  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Change data
  changes TEXT, -- JSON object with before/after values

  created_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- Views for Analytics and Reporting
-- ============================================

-- User purchases view
CREATE VIEW IF NOT EXISTS v_user_purchases AS
SELECT
  t.id as transaction_id,
  t.user_id,
  u.email,
  u.full_name,
  p.name as product_name,
  t.amount_cents / 100.0 as amount_eur,
  t.payment_status,
  t.fulfillment_status,
  t.created_at,
  t.completed_at
FROM transactions t
JOIN users u ON t.user_id = u.id
LEFT JOIN products p ON t.product_id = p.id
WHERE t.transaction_type = 'product_purchase';

-- Revenue summary view
CREATE VIEW IF NOT EXISTS v_revenue_summary AS
SELECT
  transaction_type,
  COUNT(*) as total_transactions,
  SUM(amount_cents) / 100.0 as total_revenue_eur,
  AVG(amount_cents) / 100.0 as average_amount_eur,
  DATE(created_at) as transaction_date
FROM transactions
WHERE payment_status = 'completed'
GROUP BY transaction_type, DATE(created_at);
