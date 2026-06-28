-- ================================================
-- V33: BANK ACCOUNTS TABLE
-- Company bank accounts shown on invoices
-- ================================================

CREATE TABLE bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    label VARCHAR(60) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_holder VARCHAR(200) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    branch VARCHAR(100),
    ifsc_code VARCHAR(20),
    account_type VARCHAR(30) NOT NULL DEFAULT 'Current'
        CHECK (account_type IN ('Current', 'Savings')),
    gpay_number VARCHAR(20),
    qr_code_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bank_accounts_number UNIQUE (account_number)
);

COMMENT ON TABLE bank_accounts IS 'Multiple bank accounts supported. Admin selects one per invoice';