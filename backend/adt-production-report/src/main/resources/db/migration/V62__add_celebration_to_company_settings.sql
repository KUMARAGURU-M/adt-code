-- V62: ADD CELEBRATION COLUMNS TO COMPANY SETTINGS
ALTER TABLE company_settings ADD COLUMN is_celebration BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE company_settings ADD COLUMN celebration_text TEXT;
ALTER TABLE company_settings ADD COLUMN celebration_photo_url TEXT;
