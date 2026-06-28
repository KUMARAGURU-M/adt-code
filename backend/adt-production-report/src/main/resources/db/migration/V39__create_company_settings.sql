-- ================================================
-- V39: COMPANY SETTINGS TABLE
-- Singleton table - exactly one row must ever exist
-- is_singleton UNIQUE constraint enforces this at DB level
-- ================================================

CREATE TABLE company_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL DEFAULT 'Arrow Data-Tech',
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    company_location VARCHAR(200) DEFAULT 'Puducherry',
    phone VARCHAR(20),
    email VARCHAR(150),
    portal_name VARCHAR(100) NOT NULL DEFAULT 'ADT - Production Login Portal',
    welcome_message TEXT,
    primary_color VARCHAR(10) NOT NULL DEFAULT '#c28595',
    secondary_color VARCHAR(10) NOT NULL DEFAULT '#f0979c',
    enable_top_performer_banner BOOLEAN NOT NULL DEFAULT TRUE,
    letter_pad_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    signature_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    authorized_person_name VARCHAR(100),
    designation VARCHAR(100),
    is_singleton BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_settings_singleton UNIQUE (is_singleton)
);

COMMENT ON TABLE company_settings IS
    'Singleton table - one row only. Seed before first deployment';
COMMENT ON COLUMN company_settings.is_singleton IS
    'Singleton enforcer - UNIQUE constraint prevents a second row. Always TRUE';