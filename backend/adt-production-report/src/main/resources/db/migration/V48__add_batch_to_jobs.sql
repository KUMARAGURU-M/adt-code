ALTER TABLE jobs ADD COLUMN batch VARCHAR(100);
COMMENT ON COLUMN jobs.batch IS 'number associated with the book job';
