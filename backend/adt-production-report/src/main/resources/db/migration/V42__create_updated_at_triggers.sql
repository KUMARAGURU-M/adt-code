-- ================================================
-- V42: AUTO UPDATED_AT TRIGGERS
-- Applied to all tables with updated_at column
-- NOTE: trg_import_batches is in V42 because that
--       table is created there. Triggers must be
--       created AFTER the table exists.
-- ================================================

-- Single canonical function used by all triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alias so any legacy references to trg_set_updated_at also work
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Core auth & HR ───────────────────────────────────────────────
CREATE TRIGGER trg_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employee_profiles
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employee_salary_details
    BEFORE UPDATE ON employee_salary_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Reference / lookup tables ────────────────────────────────────
CREATE TRIGGER trg_roles
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_permissions
    BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shifts
    BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_processes
    BEFORE UPDATE ON processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Clients & projects ───────────────────────────────────────────
CREATE TRIGGER trg_clients
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Import config ────────────────────────────────────────────────
CREATE TRIGGER trg_import_field_mappings
    BEFORE UPDATE ON import_field_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Production ───────────────────────────────────────────────────
CREATE TRIGGER trg_jobs
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_employee_assignments
    BEFORE UPDATE ON task_employee_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_time_logs
    BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Attendance module (tables created in V27) ────────────────────
CREATE TRIGGER trg_att_employees_updated
    BEFORE UPDATE ON attendance_employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_att_records_updated
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_att_salary_updated
    BEFORE UPDATE ON attendance_salary_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Leaves ───────────────────────────────────────────────────────
CREATE TRIGGER trg_leave_types_updated
    BEFORE UPDATE ON leave_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_leave_policies_updated
    BEFORE UPDATE ON leave_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_leave_requests_updated
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_leave_balances_updated
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Tools ────────────────────────────────────────────────────────
CREATE TRIGGER trg_tool_access
    BEFORE UPDATE ON tool_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Invoices & finance ───────────────────────────────────────────
CREATE TRIGGER trg_invoices
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── System & settings ────────────────────────────────────────────
CREATE TRIGGER trg_company_settings
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Workflows ────────────────────────────────────────────────────
CREATE TRIGGER trg_workflows
    BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
