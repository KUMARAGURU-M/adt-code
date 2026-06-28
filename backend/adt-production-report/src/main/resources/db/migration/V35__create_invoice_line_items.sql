-- ================================================
-- V35: INVOICE LINE ITEMS TABLE
-- Individual rows in the invoice table
-- ================================================

CREATE TABLE invoice_line_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sno INTEGER NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    batch_name VARCHAR(300),
    pages INTEGER NOT NULL DEFAULT 0,
    rate_per_page NUMERIC(10,2) NOT NULL DEFAULT 0,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    uploaded_date DATE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice
    ON invoice_line_items(invoice_id, sno);

COMMENT ON TABLE invoice_line_items IS 'Order by sno. Admin can add/remove rows via Add Row / delete button';
COMMENT ON COLUMN invoice_line_items.rate_per_page IS 'Snapshot at time of invoicing - may differ from current project rate';