-- ================================================
-- V08: MEDIA FILES TABLE
-- Centralised file storage registry
-- ================================================

CREATE TABLE media_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    storage_type VARCHAR(20) NOT NULL DEFAULT 'local'
        CHECK (storage_type IN ('local', 's3', 'r2')),
    entity_type VARCHAR(60),
    entity_id UUID,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_files_entity
    ON media_files(entity_type, entity_id);

CREATE INDEX idx_media_files_uploaded_by
    ON media_files(uploaded_by);

COMMENT ON TABLE media_files IS 'Centralised file storage registry for all uploads';
COMMENT ON COLUMN media_files.entity_type IS 'Context: user_profile, kyc_document, letter_pad, signature, bulk_import, invoice_pdf, qr_code';
COMMENT ON COLUMN media_files.storage_path IS 'S3 object key or relative disk path - never a full URL';