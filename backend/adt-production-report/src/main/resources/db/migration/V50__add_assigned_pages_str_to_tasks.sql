ALTER TABLE tasks ADD COLUMN assigned_pages_str VARCHAR(100);
COMMENT ON COLUMN tasks.assigned_pages_str IS 'String representation of assigned pages (e.g. All Pages, 4 - 10)';
