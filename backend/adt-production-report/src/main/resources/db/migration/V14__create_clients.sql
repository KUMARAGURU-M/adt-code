-- ================================================
-- V14: CLIENTS TABLE
-- Invoice recipient companies
-- ================================================

CREATE TABLE clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(20),
    pan_number VARCHAR(20),
    gstin VARCHAR(20),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_clients_company_name UNIQUE (company_name)
);

CREATE INDEX idx_clients_is_active
    ON clients(is_active);

COMMENT ON TABLE clients IS 'Invoice recipient companies - one client can have multiple projects';
COMMENT ON COLUMN clients.pan_number IS 'PAN card number shown on invoice';
COMMENT ON COLUMN clients.gstin IS 'GSTIN shown on invoice';