-- Run once against existing MySQL databases before deploying the auth API.
-- This migration preserves every existing password; login upgrades legacy values.
ALTER TABLE usuarios MODIFY COLUMN senha VARCHAR(255) NOT NULL;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_hash CHAR(64) NOT NULL,
  previous_refresh_hash CHAR(64) NULL,
  previous_refresh_valid_until DATETIME NULL,
  persistent BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_auth_sessions_user (user_id)
);
