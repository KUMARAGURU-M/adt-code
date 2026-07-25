-- V64: DEVELOPER PROJECT UPDATES & DOCUMENTS TABLES

CREATE TABLE dev_project_updates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    update_text TEXT NOT NULL,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dev_project_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    size VARCHAR(255) NOT NULL,
    file_url VARCHAR(500),
    media_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial updates and documents for DigiConvertor Platform
INSERT INTO dev_project_updates (project_id, author, update_text, update_date)
SELECT id, 'Kumar', 'Optimized image parsing pipeline and resolved memory leak on PDF OCR batch jobs.', CURRENT_DATE - INTERVAL '1 day'
FROM dev_projects WHERE name = 'DigiConvertor Platform';

INSERT INTO dev_project_updates (project_id, author, update_text, update_date)
SELECT id, 'Alex Rivers', 'Updated OCR Output Schema to JSON-LD specification.', CURRENT_DATE - INTERVAL '3 days'
FROM dev_projects WHERE name = 'DigiConvertor Platform';

INSERT INTO dev_project_updates (project_id, author, update_text, update_date)
SELECT id, 'David Vance', 'Integrated FastAPI async handlers for CSV stream processing.', CURRENT_DATE - INTERVAL '2 days'
FROM dev_projects WHERE name = 'Data Ingestion Suite';

INSERT INTO dev_project_updates (project_id, author, update_text, update_date)
SELECT id, 'Sarah Chen', 'Deployed analytics dashboard v1.0.', CURRENT_DATE - INTERVAL '4 days'
FROM dev_projects WHERE name = 'Analytics Engine';

-- Seed documents
INSERT INTO dev_project_documents (project_id, name, type, size)
SELECT id, 'Architecture Spec v2.4.pdf', 'PDF Document', '2.4 MB'
FROM dev_projects WHERE name = 'DigiConvertor Platform';

INSERT INTO dev_project_documents (project_id, name, type, size)
SELECT id, 'API Reference - OCR Engine.md', 'Markdown Spec', '140 KB'
FROM dev_projects WHERE name = 'DigiConvertor Platform';

INSERT INTO dev_project_documents (project_id, name, type, size)
SELECT id, 'Database ERD Schema.png', 'Image', '850 KB'
FROM dev_projects WHERE name = 'DigiConvertor Platform';

INSERT INTO dev_project_documents (project_id, name, type, size)
SELECT id, 'Ingestion Pipeline RFC.pdf', 'PDF Document', '1.8 MB'
FROM dev_projects WHERE name = 'Data Ingestion Suite';

INSERT INTO dev_project_documents (project_id, name, type, size)
SELECT id, 'Analytics Metrics Handbook.pdf', 'PDF Document', '3.1 MB'
FROM dev_projects WHERE name = 'Analytics Engine';
