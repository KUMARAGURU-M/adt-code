-- V74: ADD TOP PERFORMER COLUMNS TO COMPANY SETTINGS
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_user_id UUID;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_name VARCHAR(200);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_criteria VARCHAR(100) DEFAULT 'Monthly';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_purpose TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_photo_url TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_gif_url TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS top_performer_criteria_options TEXT DEFAULT 'Monthly,Weekly,Hardworker';