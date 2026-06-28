-- ================================================
-- V45: ADD SYSTEM SETTINGS COLUMNS TO COMPANY_SETTINGS
-- ================================================

ALTER TABLE company_settings
ADD COLUMN session_timeout INTEGER NOT NULL DEFAULT 480,
ADD COLUMN max_file_size INTEGER NOT NULL DEFAULT 10,
ADD COLUMN allowed_types VARCHAR(255) NOT NULL DEFAULT 'jpg,jpeg,png,pdf,doc,docx';
