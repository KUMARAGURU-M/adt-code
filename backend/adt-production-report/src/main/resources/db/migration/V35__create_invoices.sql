-- ================================================
-- V35: INVOICES TABLE
-- Invoice header - soft delete preserves history
-- ================================================

CREATE TABLE invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_address TEXT,
    vendor_pan VARCHAR(20),
    vendor_gstin VARCHAR(20),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_title TEXT,
    period_month VARCHAR(20),
    period_year INTEGER,
    sub_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    gst_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount_in_words TEXT,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (payment_status IN ('Pending', 'Paid', 'Overdue', 'Partially Paid')),
    total_received NUMERIC(14,2) NOT NULL DEFAULT 0,
    column_config JSONB,
    letter_pad_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    show_signature BOOLEAN NOT NULL DEFAULT TRUE,
    show_qr BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number)
);

CREATE INDEX idx_invoices_client
    ON invoices(client_id, invoice_date DESC);

CREATE INDEX idx_invoices_status
    ON invoices(payment_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_date
    ON invoices(invoice_date DESC);

COMMENT ON TABLE invoices IS 'Invoice number format: ADT-YYYY-NNNN auto-incremented per year';
COMMENT ON COLUMN invoices.column_config IS 'Table Column Configuration JSON - which columns to show and in what order';
COMMENT ON COLUMN invoices.vendor_name IS 'Snapshot of Arrow Data Tech at invoice creation - immutable history';
