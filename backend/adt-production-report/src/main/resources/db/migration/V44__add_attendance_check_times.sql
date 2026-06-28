-- ================================================
-- V44: ADD ATTENDANCE CHECK-IN/OUT TIMES
-- To track manual employee check-in and check-out times
-- ================================================

ALTER TABLE attendance_records ADD COLUMN check_in_time TIMESTAMPTZ;
ALTER TABLE attendance_records ADD COLUMN check_out_time TIMESTAMPTZ;

COMMENT ON COLUMN attendance_records.check_in_time IS 'Manual check-in timestamp of the employee';
COMMENT ON COLUMN attendance_records.check_out_time IS 'Manual check-out timestamp of the employee';
