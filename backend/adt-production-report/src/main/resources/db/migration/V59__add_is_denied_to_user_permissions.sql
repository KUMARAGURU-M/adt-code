-- V59: Add is_denied column to user_permissions to support negative overrides (blacklist/denials)
ALTER TABLE user_permissions ADD COLUMN is_denied BOOLEAN NOT NULL DEFAULT FALSE;
