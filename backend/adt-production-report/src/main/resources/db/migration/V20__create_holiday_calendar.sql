-- ================================================
-- V20: HOLIDAY CALENDAR TABLE
-- Paid holidays for auto PH attendance marking
-- ================================================

CREATE TABLE holiday_calendar (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_name VARCHAR(150) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(30) NOT NULL DEFAULT 'National'
        CHECK (holiday_type IN ('National', 'Regional', 'Optional', 'Company')),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    applicable_year INTEGER,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_holiday_calendar_date UNIQUE (holiday_date)
);

CREATE INDEX idx_holiday_calendar_date
    ON holiday_calendar(holiday_date);

CREATE INDEX idx_holiday_calendar_year
    ON holiday_calendar(applicable_year);

COMMENT ON TABLE holiday_calendar IS 'Paid holidays - scheduler auto-marks PH on these dates';
COMMENT ON COLUMN holiday_calendar.is_optional IS 'Optional holidays: employee chooses - still marks PH if taken';
