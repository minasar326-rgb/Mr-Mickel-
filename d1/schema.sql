-- ==============================================================
-- Cloudflare D1 SQL Schema for Mr. Michael Shehata LMS
-- Atomic Code Redemption, Brute-Force Rate Limiting, and Audit Trail
-- ==============================================================

-- 1. Codes Table
CREATE TABLE IF NOT EXISTS codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  code_type TEXT NOT NULL DEFAULT 'month',     -- 'stage', 'month', 'lecture', 'bundle', 'all-access'
  target_id TEXT NOT NULL,                     -- stageId, sectionId, lectureId, or 'all-access'
  target_title TEXT,
  stage_id TEXT,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,        -- 1 = active, 0 = disabled
  duration_days INTEGER NOT NULL DEFAULT 30,
  expires_at TEXT,                             -- ISO date or NULL for lifetime
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_code ON codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_target_id ON codes(target_id);

-- 2. Redemptions Table (Atomic uniqueness: one redemption per code per student)
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  uid TEXT NOT NULL,
  target_id TEXT NOT NULL,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(code, uid)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_uid ON redemptions(uid);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON redemptions(code);

-- 3. Rate Limits Table (Failed redemption attempts: 5 fails -> 10 mins freeze)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,                       -- e.g. 'fail:uid:XXX' or 'fail:ip:YYY'
  failed_attempts INTEGER NOT NULL DEFAULT 1,
  last_attempt_at INTEGER NOT NULL,          -- Unix timestamp ms
  blocked_until INTEGER NOT NULL DEFAULT 0   -- Unix timestamp ms
);

-- 4. Audit Logs Table (Immutable server-side trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,                       -- 'redeem', 'revoke', 'create_code', 'override'
  uid TEXT,
  code TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
