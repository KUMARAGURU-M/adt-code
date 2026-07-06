-- ================================================================
-- V46: HOURLY GRAPH TABLES
-- Support hourly logs, dynamic target columns, and visibility
-- ================================================================

-- 1. Create hourly_graph_settings table
CREATE TABLE IF NOT EXISTS hourly_graph_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    column_groups JSONB NOT NULL DEFAULT '[]',
    target_rows JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default column group layout only; target_rows left empty so Admin
-- populates them from real project data via the Hourly Graph UI.
INSERT INTO hourly_graph_settings (id, column_groups, target_rows)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '[
      {"key": "complexity", "label": "Complexity of Coding (Page/Day)", "tint": "tint-1", "columns": [{"id": "simple", "label": "Simple"}, {"id": "medium", "label": "Medium"}, {"id": "complex", "label": "Complex"}, {"id": "hcomplex", "label": "H.Complex"}]},
      {"key": "article", "label": "Article", "tint": "tint-2", "columns": [{"id": "filteration", "label": "Filteration"}, {"id": "accepted", "label": "Accepted"}]},
      {"key": "math", "label": "Math Keying/Day", "tint": "tint-3", "columns": [{"id": "inline", "label": "Inline"}, {"id": "display", "label": "Display"}]},
      {"key": "image", "label": "Image Crop/Day", "tint": "tint-4", "columns": [{"id": "inline", "label": "Inline"}, {"id": "display", "label": "Display"}]},
      {"key": "ref", "label": "Ref Coding/Day", "tint": "tint-5", "columns": [{"id": "noOfRef", "label": "No of Ref"}]},
      {"key": "proof", "label": "Proof Reading/Spell check", "tint": "tint-6", "columns": [{"id": "simple", "label": "Simple"}, {"id": "complex", "label": "Complex"}]}
    ]'::jsonb,
    '[]'::jsonb
) ON CONFLICT DO NOTHING;

-- 2. Create hourly_production_logs table
CREATE TABLE IF NOT EXISTS hourly_production_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_name VARCHAR(100),
    process_name VARCHAR(255),
    in_time VARCHAR(10),
    out_time VARCHAR(10),
    project_name VARCHAR(255),
    hours JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hourly_production_logs_date_user UNIQUE (date, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hourly_prod_logs_date ON hourly_production_logs(date);
CREATE INDEX IF NOT EXISTS idx_hourly_prod_logs_user ON hourly_production_logs(user_id);

COMMENT ON TABLE hourly_production_logs IS 'Daily hourly production updates of employees';

