-- V66: ADD IS_OVERTIME TO TIME LOGS
-- Allow storing whether the time log session is overtime or not.
-- Uses IF NOT EXISTS so this migration is safe to re-run.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'is_overtime') THEN
        ALTER TABLE time_logs ADD COLUMN is_overtime BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN time_logs.is_overtime IS 'True if the work session is overtime, false otherwise';
