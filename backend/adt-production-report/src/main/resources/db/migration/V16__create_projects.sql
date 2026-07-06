-- ================================================
-- V16: PROJECTS TABLE
-- Publisher projects with billing configuration
-- ================================================

CREATE TABLE projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    type VARCHAR(30) NOT NULL DEFAULT 'Per Page'
        CHECK (type IN (
            'Per Page',
            'Hourly',
            'Per Article',
            'Per KB'
        )),

    complexity_level VARCHAR(20) NOT NULL DEFAULT 'Medium'
        CHECK (complexity_level IN (
            'Simple',
            'Medium',
            'Complex',
            'Heavy Complex'
        )),

    rate_per_page NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    hourly_rate NUMERIC(10,2),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index allows reuse of name after soft delete
CREATE UNIQUE INDEX idx_projects_name
    ON projects(name)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_is_active
    ON projects(is_active)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_client_id
    ON projects(client_id);

COMMENT ON TABLE projects IS 'Publisher projects e.g. LDM-Hanser, ING-OUP with billing config';

COMMENT ON COLUMN projects.type IS
'Billing model: Per Page, Hourly, Per Article, Per KB';

COMMENT ON COLUMN projects.rate_per_page IS
'INR per page for PDF/EPUB/XML/HTML billing';
