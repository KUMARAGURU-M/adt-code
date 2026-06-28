-- ================================================
-- V47: ADD THIRUKKURAL SETTINGS COLUMNS TO COMPANY_SETTINGS
-- ================================================

ALTER TABLE company_settings
ADD COLUMN enable_thirukkural BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN thirukkural_translation VARCHAR(50) NOT NULL DEFAULT 'all';
