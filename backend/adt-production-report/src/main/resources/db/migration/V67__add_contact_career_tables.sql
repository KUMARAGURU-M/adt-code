-- V67: Contact Inquiries, Career Applications, and Job Openings tables

CREATE TABLE contact_inquiries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200)  NOT NULL,
    email       VARCHAR(300)  NOT NULL,
    phone       VARCHAR(50),
    company     VARCHAR(300),
    service     VARCHAR(100),
    message     TEXT          NOT NULL,
    status      VARCHAR(30)   NOT NULL DEFAULT 'NEW',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE job_openings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(300)  NOT NULL,
    department  VARCHAR(200)  NOT NULL,
    location    VARCHAR(200)  NOT NULL,
    job_type    VARCHAR(50)   NOT NULL DEFAULT 'Full-Time',
    experience  VARCHAR(100),
    description TEXT,
    tags        TEXT,
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE career_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title           VARCHAR(300)  NOT NULL,
    department          VARCHAR(200),
    name                VARCHAR(200)  NOT NULL,
    email               VARCHAR(300)  NOT NULL,
    phone               VARCHAR(50),
    portfolio           VARCHAR(500),
    cover_note          TEXT,
    resume_file_name    VARCHAR(400),
    resume_media_file_id UUID,
    status              VARCHAR(30)   NOT NULL DEFAULT 'NEW',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_career_app_media FOREIGN KEY (resume_media_file_id)
        REFERENCES media_files(id) ON DELETE SET NULL
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER trg_contact_inquiries_updated_at
    BEFORE UPDATE ON contact_inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_job_openings_updated_at
    BEFORE UPDATE ON job_openings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_career_applications_updated_at
    BEFORE UPDATE ON career_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
