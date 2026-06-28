-- ================================================
-- V49: ADD UPDATED_AT COLUMN TO PERMISSIONS TABLE
-- ================================================

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_permissions ON permissions;
CREATE TRIGGER trg_permissions
    BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

